const express = require('express');
const app = express();
const handlebars = require('express-handlebars')
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('users.db');


app.engine('handlebars', handlebars.engine({defaultLayout: 'main',
 runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,

        },
}));


app.set('view engine', 'handlebars');

app.use(express.urlencoded({extended:false}))
app.use(express.json())
 
 
function data() {
  let dataHoraAtual = new Date();

  dataHoraAtual.setUTCHours(dataHoraAtual.getUTCHours() );
  let hora = dataHoraAtual.getHours();
  let minutos = dataHoraAtual.getMinutes();
  let segundos = dataHoraAtual.getSeconds();
  let dia = dataHoraAtual.getDate();
  let mes = dataHoraAtual.getMonth() + 1;
  let ano = dataHoraAtual.getFullYear();

  hora = hora < 10 ? '0' + hora : hora;
  minutos = minutos < 10 ? '0' + minutos : minutos;
  segundos = segundos < 10 ? '0' + segundos : segundos;
  dia = dia < 10 ? '0' + dia : dia;
  mes = mes < 10 ? '0' + mes : mes;

  let dataHoraBrasilia = `${ano}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;

  return String(dataHoraBrasilia);
} 

 

app.get('/users', async function(req,res) {  
   
  const tabela=await db.all('select * FROM USERS',(erro,rows)=>{
    if(erro){ 
     console.log('nenhum usúario cadastrado'+erro)
      let msg="sem usúarios cadastrados"
      res.render('home_sql',{msg:msg})
    }else{ 
      res.render('home_sql',{rows:rows,user:app.locals.user})
    }
  })

    
})



app.get('/users/sign',function(req,res){
if (app.locals.user==undefined) {
res.render('formulario')   
}else{
  res.send('já encontra-se cadastrado')
} 
});

app.get('/users/login',function(req,res){
  if (app.locals.user!==undefined) {
 res.send('já está logado')
  }else{
    res.render('logar')
  }
});

app.post('/users/enter',async function(req,res){
const {nome,senha} = req.body
  db.get(` 
    SELECT id,nome,senha
    FROM USERS
    WHERE nome =
    ?  AND  senha = ?
  `,[nome,senha],(erro,row)=>{
    if (erro) {
      console.log(erro)
    }else if(row!==undefined){ 
      app.locals.user = {nome:nome,senha:senha,id:row.id}  
      console.log(app.locals.user)
      res.redirect('/users')
    }else{
      let msg="senha ou nome invalidos"
      res.render('logar',{msg:msg})
    }


  });




 
});

app.get('/users/getoff',async function(req,res){
 app.locals.user=undefined
 res.send('deslogado')
})


app.get('/users/msg/:id',async function(req,res){
 
  if(app.locals.user!==undefined){
  db.get(` 
    SELECT id_user,msg
    FROM CHAT
    WHERE id_user = ${req.params.id}
  `,(erro,row)=>{
   if (erro) { 
    console.log(erro)
   }else{
    let t=JSON.parse(row.msg)
    let user_1=app.locals.user['id']
    let user_2=req.params.id
    let Key = 'conversas_de' + (user_1 < user_2 ? user_1 + ' e ' + user_2 : user_2 + ' e ' + user_1);
    console.log(t['chat'])
    res.render('chat',{id:req.params.id,t:t['chat'][Key]})
   }

  });
 }

})
app.post('/msg/:id', async function (req, res) {
  const { msg } = req.body;

  if (app.locals.user !== undefined) {
db.get('SELECT msg FROM CHAT WHERE id_user IN (?, ?)', [req.params.id, app.locals.user['id']], (error, row) => {

      if (row) {
        
         let chatObject =JSON.parse(row.msg) 
        let user_1=app.locals.user['id']
        let user_2=req.params.id
        let Key = 'conversas_de' + (user_1 < user_2 ? user_1 + ' e ' + user_2 : user_2 + ' e ' + user_1);

 if (!chatObject['chat'][Key]) {
    chatObject['chat'][Key] = [];
}
        
        let obj_msg = {};
        obj_msg.horario=data()    
        obj_msg.msg_user=msg
        obj_msg.user=user_1
        chatObject['chat'][Key].push(obj_msg)
        console.log(chatObject['chat'])
 
        
         
        db.run('UPDATE chat set msg=? where id_user = (?)',[JSON.stringify(chatObject),user_1])
        db.run('UPDATE chat set msg=? where id_user = (?)',[JSON.stringify(chatObject),user_2])
 

       } else {
        console.log(erro);
        res.status(404).send('User not found');
      }
    });
  }
});

 
app.post('/users/envio', async function(req,res){
 const {nome,biografia,senha} = req.body
     
 db.run('INSERT INTO USERS (nome, biografia, createdAt, updatedAt,senha) VALUES (?,?,?,?,?)', nome, biografia, data(), data(),senha);
 db.run(`
    CREATE TABLE IF NOT EXISTS CHAT (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_user INTEGER NOT NULL,
      msg JSON, 
      FOREIGN KEY (id_user) REFERENCES USERS(id)
    )
  `);
db.run(`
    CREATE TABLE IF NOT EXISTS CHAT ( 
      id_user INTEGER NOT NULL,
      msg JSON, 
      FOREIGN KEY (id_user) REFERENCES USERS(id)
    )
  `);
   let chat = db.prepare('INSERT INTO CHAT ( msg) VALUES (?)');
     chat.run('{"chat":[]}');
   
     res.redirect('/users')

 });
app.get('/users/remover/:id', async function(req,res){
    const resp=await db.run(`DELETE FROM USERS  WHERE id =${req.params.id } `) 
   res.redirect('/users')

}) 
app.get('/users/selecionar/:id', async function(req,res){ 
 
  await db.all(`SELECT * FROM USERS where id = ${req.params.id}`,(erro,row)=>{
      if (erro) {
        console.log(erro)
      }else if (row) {
       let  obj = {...row };
         obj=obj[0]     
       res.render('editar',{obj})
    }
    
    });
 
    
}) 

app.post('/users/editar', async function(req,res){
 const {nome,biografia,id} = req.body
 
await db.run(
    'UPDATE USERS SET nome = ?, biografia = ?, updatedAt = ? WHERE id = ?',
    [nome, biografia, data(), id]
  );
console.log('perfil atualizado')   
res.redirect('/users')
})


app.listen(3001,()=>{console.log('servidor rodando na porta 3001')})  