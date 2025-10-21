// Updated frontend logic with deposit flow (phone-only auth)
const API_URL = 'REPLACE_WITH_API_URL'; // set when backend ready

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
  if(document.getElementById('pname')) document.getElementById('pname').innerText = u?.name||'-';
  if(document.getElementById('pphone')) document.getElementById('pphone').innerText = u?.phone||'-';
  if(document.getElementById('refBox')){
    const link = location.href.replace(/\\/[^\\/]*$/,'/') + 'index.html?ref=' + (u?u.phone:'');
    document.getElementById('refBox').innerHTML = `<input readonly value="${link}" style="width:100%"/>`;
  }
}

// Auth phone-only
function showRegister(){ document.getElementById('login-form').style.display='none'; document.getElementById('register-form').style.display='block' }
function showLogin(){ document.getElementById('login-form').style.display='block'; document.getElementById('register-form').style.display='none' }

function doRegisterPhone(){
  const name=document.getElementById('reg-name').value.trim();
  const phone=document.getElementById('reg-phone').value.trim();
  if(!name || !phone){ alert('নাম ও ফোন দিন'); return }
  if(findUserByPhone(phone)){ alert('এই ফোন আগে আছে'); return }
  const users=getUsers();
  const user={id:Date.now(),name,phone,balance:0};
  users.push(user); saveUsers(users); saveCurrent(user);
  alert('রেজিস্ট্রেশন সফল'); location.href='home.html';
}

function doLoginPhone(){
  const phone=document.getElementById('login-phone').value.trim();
  if(!phone){ alert('ফোন নম্বর দিন'); return }
  const u=findUserByPhone(phone);
  if(!u){ alert('ইউজার নেই — দয়া করে রেজিস্টার করুন'); return }
  saveCurrent(u); alert('লগইন সফল'); location.href='home.html';
}

// Deposit flow
const PAYMENT_NUMBERS = {
  bkash: '018XXXXXXXX',
  nagad: '017XXXXXXXX',
  rocket: '019XXXXXXXX'
};

function showAccountNumber(){
  const method = document.getElementById('payMethod').value;
  const amt = parseFloat(document.getElementById('depositAmount').value||0);
  if(amt > 0){
    document.getElementById('accountRow').style.display='block';
    document.getElementById('accountNumber').innerText = PAYMENT_NUMBERS[method] || '০১৮XXXXXXXX';
  } else {
    document.getElementById('accountRow').style.display='none';
  }
}

function submitDeposit(){
  const method = document.getElementById('payMethod').value;
  const amt = parseFloat(document.getElementById('depositAmount').value||0);
  const trx = document.getElementById('depositTrx').value.trim();
  if(!amt){ alert('সঠিক এমাউন্ট দিন'); return }
  if(!trx){ alert('Txn ID দিন (ট্রানজেকশন আইডি)'); return }
  const cur = currentUser();
  if(!cur){ alert('প্রথমে লগইন করুন'); location.href='login.html'; return }
  // create deposit request (localStorage) and try to send to backend if API_URL set
  const reqs = JSON.parse(localStorage.getItem('wr_deposits')||'[]');
  const item = {id:Date.now(), phone:cur.phone, method, amount:amt, trx_id:trx, status:'pending', created:new Date().toISOString()};
  reqs.unshift(item);
  localStorage.setItem('wr_deposits', JSON.stringify(reqs));
  document.getElementById('depositMsg').innerText = '✅ আপনার ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন যাচাই করে ব্যালেন্স যোগ করবে।';
  // try API
  if(API_URL && API_URL !== 'REPLACE_WITH_API_URL'){
    fetch(API_URL + '/api/deposit-request', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({phone:cur.phone, method, amount:amt, trx_id:trx})
    }).then(r=>r.json()).then(j=> console.log('deposit sent', j)).catch(e=>console.warn(e));
  }
  // clear inputs
  document.getElementById('depositTrx').value='';
  document.getElementById('depositAmount').value='';
  setTimeout(()=>{ location.href='home.html'; },1200);
}

// Withdraw
function submitWithdraw(){
  const amt = parseFloat(document.getElementById('wdAmount').value||0);
  const num = document.getElementById('wdNumber').value.trim();
  if(!amt || !num){ alert('সঠিক তথ্য দিন'); return }
  const cur = currentUser();
  if(!cur){ alert('লগইন করুন'); location.href='login.html'; return }
  if(cur.balance < amt){ alert('Insufficient balance'); return }
  const reqs = JSON.parse(localStorage.getItem('wr_withdraws')||'[]');
  reqs.unshift({id:Date.now(), phone:cur.phone, amount:amt, to_number:num, status:'pending', created:new Date().toISOString()});
  localStorage.setItem('wr_withdraws', JSON.stringify(reqs));
  // deduct locally until admin pays (simulate hold)
  const users = getUsers();
  const idx = users.findIndex(u=>u.phone===cur.phone);
  if(idx!==-1){ users[idx].balance = users[idx].balance - amt; saveUsers(users); saveCurrent(users[idx]); updateBalanceUI(); }
  alert('Withdraw request জমা হয়েছে। অ্যাডমিন যাচাই করবে।');
  location.href='home.html';
}

// helper admin credit (for testing)
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

// init
(function init(){ try{ updateBalanceUI(); }catch(e){} })();
