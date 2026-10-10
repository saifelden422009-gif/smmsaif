const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe-Admin-2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "CHANGE-THIS-TO-A-LONG-RANDOM-SECRET";
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json({limit:"100kb"}));
app.use(session({
  name:"smmsaif.sid", secret:SESSION_SECRET, resave:false, saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1000*60*60*8}
}));
app.use(express.static(path.join(__dirname,"public")));

const initialServices = [
 {id:1,platform:"TikTok",name:"متابعين تيك توك",unit:1000,price:75,min:100,guarantee:"ضمان مدى الحياة"},
 {id:2,platform:"TikTok",name:"لايكات تيك توك",unit:1000,price:20,min:100,guarantee:"ضمان مدى الحياة"},
 {id:3,platform:"TikTok",name:"مشاهدات تيك توك",unit:100000,price:25,min:100,guarantee:"ضمان مدى الحياة"},
 {id:4,platform:"Instagram",name:"متابعين إنستجرام",unit:1000,price:35,min:100,guarantee:"ضمان مدى الحياة"},
 {id:5,platform:"Instagram",name:"لايكات إنستجرام",unit:1000,price:15,min:100,guarantee:"ضمان مدى الحياة"},
 {id:6,platform:"Instagram",name:"مشاهدات إنستجرام",unit:1000,price:9,min:100,guarantee:"ضمان مدى الحياة"},
 {id:7,platform:"Facebook",name:"متابعين فيسبوك",unit:1000,price:75,min:100,guarantee:"ضمان مدى الحياة"},
 {id:8,platform:"Facebook",name:"لايكات فيسبوك",unit:1000,price:20,min:100,guarantee:"ضمان مدى الحياة"},
 {id:9,platform:"Facebook",name:"مشاهدات فيسبوك",unit:100000,price:25,min:100,guarantee:"ضمان مدى الحياة"},
 {id:10,platform:"YouTube",name:"متابعين يوتيوب",unit:1000,price:80,min:100,guarantee:"ضمان مدى الحياة"},
 {id:11,platform:"YouTube",name:"لايكات يوتيوب",unit:1000,price:25,min:100,guarantee:"ضمان مدى الحياة"},
 {id:12,platform:"YouTube",name:"مشاهدات يوتيوب",unit:100000,price:30,min:100,guarantee:"ضمان مدى الحياة"},
 {id:13,platform:"Snapchat",name:"مشاهدات سناب شات",unit:1000,price:40,min:100,guarantee:"ضمان مدى الحياة"},
 {id:14,platform:"WhatsApp",name:"متابع قناة واتساب — رشق مصري",unit:1000,price:180,min:100,guarantee:"ضمان مدى الحياة"},
 {id:15,platform:"WhatsApp",name:"متابع قناة واتساب — رشق تركيا",unit:1000,price:100,min:100,guarantee:"ضمان مدى الحياة"},
 {id:16,platform:"WhatsApp",name:"تصويت قناة واتساب ثابت",unit:1000,price:250,min:100,guarantee:"ضمان مدى الحياة"},
 {id:17,platform:"WhatsApp",name:"زيادة وصول قناة واتساب",unit:1000,price:35,min:100,guarantee:"ضمان مدى الحياة"},
 {id:18,platform:"Telegram",name:"أعضاء حسابات محذوفة بدون نقص",unit:1000,price:65,min:100,guarantee:"ضمان مدى الحياة"},
 {id:19,platform:"Telegram",name:"أعضاء ثابتين ومتفاعلين بدون نقص",unit:1000,price:52,min:100,guarantee:"ضمان مدى الحياة"},
 {id:20,platform:"Telegram",name:"تصويت تليجرام",unit:1000,price:35,min:100,guarantee:"ضمان مدى الحياة"},
 {id:21,platform:"Telegram",name:"حسابات حقيقية",unit:100,price:75,min:100,guarantee:"ضمان مدى الحياة"},
 {id:22,platform:"Telegram",name:"تفاعل مختلف",unit:1000,price:10,min:100,guarantee:"ضمان مدى الحياة"}
];
function loadDB(){
 if(!fs.existsSync(DB_FILE)){
   const seed={nextCustomer:1001,nextOrder:1,nextTopup:1,services:initialServices,customers:[],orders:[],topups:[],transactions:[]};
   fs.writeFileSync(DB_FILE,JSON.stringify(seed,null,2));
 }
 return JSON.parse(fs.readFileSync(DB_FILE,"utf8"));
}
function saveDB(db){fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2));}
function requireAdmin(req,res,next){if(!req.session.admin)return res.status(401).json({error:"سجّل دخول الأدمن أولًا"});next();}
function requireCustomer(req,res,next){if(!req.session.customerId)return res.status(401).json({error:"أدخل رقم العميل أولًا"});next();}
function transaction(db,customerId,type,amount,note,ref){
 db.transactions.unshift({id:Date.now()+Math.random(),customerId,type,amount,note,ref,createdAt:new Date().toISOString()});
}
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/api/services",(req,res)=>res.json(loadDB().services));
app.post("/api/customer/access",(req,res)=>{
 const id=String(req.body.id||"").trim(); if(!id)return res.status(400).json({error:"اكتب رقم العميل"});
 const db=loadDB(); let c=db.customers.find(x=>x.id===id);
 if(!c){return res.status(404).json({error:"رقم العميل غير موجود. اطلب من الأدمن إنشاء حساب عميل لك."});}
 req.session.customerId=c.id; res.json({ok:true,customer:{id:c.id,balance:c.balance}});
});
app.get("/api/customer/me",requireCustomer,(req,res)=>{
 const db=loadDB(), c=db.customers.find(x=>x.id===req.session.customerId);
 if(!c){req.session.customerId=null;return res.status(401).json({error:"العميل غير موجود"});}
 res.json({customer:c,orders:db.orders.filter(o=>o.customerId===c.id),topups:db.topups.filter(t=>t.customerId===c.id),transactions:db.transactions.filter(t=>t.customerId===c.id),services:db.services});
});
app.post("/api/customer/logout",(req,res)=>{req.session.customerId=null;res.json({ok:true});});
app.post("/api/orders",requireCustomer,(req,res)=>{
 const db=loadDB(), c=db.customers.find(x=>x.id===req.session.customerId);
 const service=db.services.find(s=>s.id===Number(req.body.serviceId));
 const quantity=Number(req.body.quantity), link=String(req.body.link||"").trim();
 if(!c||!service)return res.status(400).json({error:"العميل أو الخدمة غير موجودة"});
 if(!link||!Number.isFinite(quantity)||quantity<Math.max(100,service.min))return res.status(400).json({error:"أدخل رابطًا صحيحًا وكمية لا تقل عن 100"});
 const cost=Math.round((quantity/service.unit*service.price)*100)/100;
 if(c.balance<cost)return res.status(400).json({error:"رصيدك غير كافٍ. اشحن رصيدك أولًا."});
 c.balance=Math.round((c.balance-cost)*100)/100;
 const order={id:db.nextOrder++,customerId:c.id,serviceId:service.id,serviceName:service.name,platform:service.platform,link,quantity,cost,status:"بانتظار المراجعة",createdAt:new Date().toISOString(),refunded:false};
 db.orders.unshift(order);transaction(db,c.id,"خصم طلب",-cost,`طلب #${order.id}: ${service.name}`,order.id);saveDB(db);
 res.json({ok:true,order,balance:c.balance});
});
app.post("/api/topups",requireCustomer,(req,res)=>{
 const db=loadDB(), amount=Number(req.body.amount), payer=String(req.body.payer||"").trim();
 if(!Number.isFinite(amount)||amount<=0||!payer)return res.status(400).json({error:"اكتب المبلغ ورقم التحويل"});
 const t={id:db.nextTopup++,customerId:req.session.customerId,amount,payer,status:"قيد المراجعة",createdAt:new Date().toISOString()};
 db.topups.unshift(t);saveDB(db);res.json({ok:true,topup:t});
});
app.post("/api/admin/login",(req,res)=>{
 if(String(req.body.password||"")!==ADMIN_PASSWORD)return res.status(401).json({error:"كلمة المرور غير صحيحة"});
 req.session.admin=true;res.json({ok:true});
});
app.post("/api/admin/logout",(req,res)=>{req.session.admin=null;res.json({ok:true});});
app.get("/api/admin/data",requireAdmin,(req,res)=>{const db=loadDB();res.json(db);});
app.post("/api/admin/customers",requireAdmin,(req,res)=>{
 const db=loadDB(), id="SM"+db.nextCustomer++;
 const c={id,balance:0,createdAt:new Date().toISOString()};
 db.customers.unshift(c);transaction(db,id,"إنشاء حساب",0,"إنشاء حساب عميل",null);saveDB(db);res.json({ok:true,customer:c});
});
app.post("/api/admin/balance",requireAdmin,(req,res)=>{
 const db=loadDB(), id=String(req.body.customerId||""), amount=Number(req.body.amount), action=req.body.action, note=String(req.body.note||"تعديل رصيد من الأدمن");
 const c=db.customers.find(x=>x.id===id);
 if(!c||!Number.isFinite(amount)||amount<=0||!["add","deduct"].includes(action))return res.status(400).json({error:"راجع رقم العميل والمبلغ"});
 if(action==="deduct"&&c.balance<amount)return res.status(400).json({error:"رصيد العميل لا يكفي"});
 const delta=action==="add"?amount:-amount;c.balance=Math.round((c.balance+delta)*100)/100;
 transaction(db,id,action==="add"?"إضافة رصيد":"خصم رصيد",delta,note,null);saveDB(db);res.json({ok:true,balance:c.balance});
});
app.post("/api/admin/orders/:id/status",requireAdmin,(req,res)=>{
 const db=loadDB(), order=db.orders.find(o=>o.id===Number(req.params.id)), status=String(req.body.status||"");
 if(!order||!["تم رفض الطلب","الطلب قيد التنفيذ","تم اكتمال الطلب"].includes(status))return res.status(400).json({error:"طلب أو حالة غير صحيحة"});
 if(status==="تم رفض الطلب"&&!order.refunded){
  const c=db.customers.find(x=>x.id===order.customerId);
  if(c){c.balance=Math.round((c.balance+order.cost)*100)/100;transaction(db,c.id,"استرداد طلب",order.cost,`استرداد قيمة الطلب #${order.id}`,order.id);}
  order.refunded=true;
 }
 order.status=status;order.updatedAt=new Date().toISOString();saveDB(db);res.json({ok:true,order});
});
app.post("/api/admin/topups/:id/status",requireAdmin,(req,res)=>{
 const db=loadDB(), t=db.topups.find(x=>x.id===Number(req.params.id)), status=String(req.body.status||"");
 if(!t||!["تمت الموافقة","مرفوض"].includes(status))return res.status(400).json({error:"طلب شحن أو حالة غير صحيحة"});
 if(status==="تمت الموافقة"&&t.status!=="تمت الموافقة"){
  const c=db.customers.find(x=>x.id===t.customerId);if(!c)return res.status(404).json({error:"العميل غير موجود"});
  c.balance=Math.round((c.balance+t.amount)*100)/100;transaction(db,c.id,"شحن رصيد",t.amount,`اعتماد طلب شحن #${t.id}`,t.id);
 }
 t.status=status;saveDB(db);res.json({ok:true});
});
app.post("/api/admin/services/:id",requireAdmin,(req,res)=>{
 const db=loadDB(), s=db.services.find(x=>x.id===Number(req.params.id)), price=Number(req.body.price);
 if(!s||!Number.isFinite(price)||price<0)return res.status(400).json({error:"سعر غير صحيح"});
 s.price=price;saveDB(db);res.json({ok:true});
});
app.get("/health",(req,res)=>res.json({ok:true}));
app.listen(PORT,()=>console.log(`smmsaif running on port ${PORT}`));
