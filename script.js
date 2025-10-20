// Phone-only simple frontend (localStorage based) 
// NOTE: This is frontend-only. Replace with API calls when backend ready.
const API_URL = 'REPLACE_WITH_API_URL';

function getUsers(){ try{ return JSON.parse(localStorage.getItem('wr_users')||'[]') }catch(e){return []} }
function saveUsers(u){ localStorage.setItem('wr_users', JSON.stringify(u)) }
function findUserByPhone(phone){ return getUsers().find(x=>x.phone===phone) }
function currentUser(){ return JSON.parse(localStorage.getItem('wr_current')||'null') }
function saveCurrent(u){ localStorage.setItem('wr_current', JSON.stringify(u)) }
function updateBalanceUI(){
  const u = currentUser();
  const bal = u ? u.balance : 0;
  const els = document.querySelectorAll('#bal,#pbal');
  els.forEach(e=>e && (e.innerText = '৳' + (bal||0)));
  if(document.getElementById('pname')){ document.getElementById('pname').innerText = u?.name||'-' }
  if(document.getElementById('pphone')){ document.getElementById('pphone').innerText = u?.phone||'-' }
  if(document.getElementById('refBox')){ 
    const link = location.href.replace(/\/[^\/]*$/,'/') + 'index.html?ref=' + (u?u.phone:'');
    document.getElementById('refBox').innerHTML = `<input readonly value="${link}" style="width:100%"/>`;
  }
}

// Auth (phone-only)
function showRegister(){ document.getElementById('login-form').style.display='none'; document.getElementById('register-form').style.display='block' }
function showLogin(){ document.getElementById('login-form').style.display='block'; document.getElementById('register-form').style.display='none' }

function doRegisterPhone(){
  const name=document.getElementById('reg-name').value.trim();
  const phone=document.getElementById('reg-phone').value.trim();
  if(!name || !phone){ alert('নাম ও ফোন নম্বর দিন'); return }
  if(findUserByPhone(phone)){ alert('এই ফোন আগে ব্যবহার হয়েছে'); return }
  const users=getUsers();
  const user={id:Date.now(),name,phone,balance:0};
  users.push(user); saveUsers(users); saveCurrent(user);
  alert('রেজিস্টেশন সফল'); location.href='home.html';
}

function doLoginPhone(){
  const phone=document.getElementById('login-phone').value.trim();
  if(!phone){ alert('ফোন নম্বর দিন'); return }
  const u=findUserByPhone(phone);
  if(!u){ alert('ইউজার পাওয়া যায়নি — আপনি রেজিস্টার করুন'); return }
  saveCurrent(u); alert('লগইন সফল'); location.href='home.html';
}

// Deposit submit (frontend localStorage)
function submitDeposit(){
  const method = document.getElementById('payMethod').value;
  const amt = parseFloat(document.getElementById('depositAmount').value) || 0;
  const trx = document.getElementById('depositTrx').value.trim();
  if(!amt || !trx){ alert('এমাউন্ট ও ট্রানজেকশন আইডি দিন'); return }
  const reqs = JSON.parse(localStorage.getItem('wr_deposits')||'[]');
  reqs.push({id:Date.now(),phone:currentUser()?.phone,method,amt,trx,status:'pending',created:new Date().toISOString()});
  localStorage.setItem('wr_deposits', JSON.stringify(reqs));
  alert('Deposit request জমা হয়েছে। অ্যাডমিন যাচাই করবে।');
  location.href='home.html';
}

// Withdraw request
function submitWithdraw(){
  const amt = parseFloat(document.getElementById('wdAmount').value||0);
  const num = document.getElementById('wdNumber').value.trim();
  if(!amt || !num){ alert('সঠিক তথ্য দিন'); return }
  const reqs = JSON.parse(localStorage.getItem('wr_withdraws')||'[]');
  reqs.push({id:Date.now(),phone:currentUser()?.phone,amt,num,status:'pending',created:new Date().toISOString()});
  localStorage.setItem('wr_withdraws', JSON.stringify(reqs));
  alert('Withdraw request জমা হয়েছে। অ্যাডমিন যাচাই করবে।');
  location.href='home.html';
}

// helper to credit demo by admin later - simulated function (for testing)
function creditDemoTo(phone, amount){
  const users = getUsers();
  const idx = users.findIndex(u=>u.phone===phone);
  if(idx===-1) return false;
  users[idx].balance = (users[idx].balance||0) + amount;
  saveUsers(users);
  const cur = currentUser();
  if(cur && cur.phone===phone){ saveCurrent(users[idx]); updateBalanceUI(); }
  return true;
}

// init UI
(function init(){
  try{ updateBalanceUI() }catch(e){}
})();
