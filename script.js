document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const KEY = "campusVoiceAnnouncements_v1", SESSION = "campusVoiceDemoSession_v1";
  const starters = [
    ["academic-001","Academic","Internal Assessment Schedule","Internal assessments begin next Monday. Check your department timetable and prepare accordingly.","2026-10-25","10:30","Everyone",12],
    ["event-001","Events","Annual Tech Fest","Join technical events, coding competitions and innovative challenges. Register and showcase your skills.","2026-10-28","11:00","Everyone",24],
    ["placement-001","Placement","Campus Recruitment Drive","Eligible final-year students are invited to participate in the upcoming recruitment drive. Keep your resume ready.","2026-10-30","14:00","Students",18],
    ["exam-001","Academic","Semester Examination Timetable","The semester examination timetable will be announced soon. Check the official schedule regularly.","2026-11-02","10:00","Students",15],
    ["workshop-001","Events","Web Development Workshop","Participate in a hands-on workshop covering HTML, CSS and JavaScript. All interested students are welcome.","2026-11-04","10:00","Everyone",20],
    ["internship-001","Placement","Internship Opportunities","Prepare your resume and watch for internship eligibility details and application deadlines.","2026-11-05","11:00","Students",32],
    ["assignment-001","Academic","Assignment Submission Deadline","Complete and submit pending assignments before the deadline specified by your faculty.","2026-11-06","16:00","Students",9],
    ["sports-001","Events","Annual Sports Meet","Get ready for sports competitions and team events. Contact the sports coordinator to participate.","2026-11-08","09:00","Everyone",27],
    ["seminar-001","Academic","Technical Seminar on Artificial Intelligence","Attend a seminar introducing AI, its applications and emerging technology trends.","2026-11-10","11:30","Everyone",14],
    ["training-001","Placement","Placement Preparation Session","Prepare for recruitment drives with aptitude, programming fundamentals and interview skills.","2026-11-12","14:00","Students",21]
  ].map((x,i)=>({id:x[0],category:x[1],title:x[2],description:x[3],date:x[4],time:x[5],audience:x[6],likes:x[7],author:"Campus Admin",createdAt:i+1}));

  let user=null, category="All", items=[], currentView="home", calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  try { items=JSON.parse(localStorage.getItem(KEY)) || starters; if(!Array.isArray(items)) items=starters; } catch(e) { items=starters; }
  const save = () => { try { localStorage.setItem(KEY,JSON.stringify(items)); return true; } catch(e) { alert("Could not save in this browser."); return false; } };

  function loginFields() {
    const role=$("#loginRole").value, admin=role==="Admin", staff=["Staff","HOD","Principal"].includes(role);
    $("#personFields").hidden=admin; $("#adminFields").hidden=!admin;
    $("#studentIdField").hidden=role!=="Student"; $("#staffIdField").hidden=!staff;
    $("#personName").required=!admin; $("#personId").required=role==="Student";
    $("#staffId").required=staff; $("#adminUsername").required=admin; $("#adminPassword").required=admin;
  }
  $("#loginRole").addEventListener("change",loginFields); loginFields();

  function canSee(item) {
    if(user.role==="Admin" || item.audience==="Everyone") return true;
    if(item.audience==="Students") return user.role==="Student";
    if(item.audience==="Staff") return ["Staff","HOD","Principal"].includes(user.role);
    if(item.audience==="Leadership") return ["HOD","Principal"].includes(user.role);
    return true;
  }
  function dateLabel(item) {
    const d=new Date(item.date+"T00:00:00");
    const date=Number.isNaN(d.getTime())?item.date:new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(d);
    if(!item.time) return "🕒 "+date;
    const [h,m]=item.time.split(":").map(Number), t=new Date(); t.setHours(h,m||0,0,0);
    return "🕒 "+date+" · "+new Intl.DateTimeFormat("en-IN",{hour:"2-digit",minute:"2-digit"}).format(t);
  }

  function makeCard(item) {
    const card=document.createElement("article"); card.className="announcement-card";
    const content=document.createElement("div"); content.className="card-content";
    const top=document.createElement("div"); top.className="card-top";
    const source=document.createElement("span"); source.textContent="@campus · "+item.category;
    const badge=document.createElement("span"); badge.className="badge "+item.category.toLowerCase()+"-badge"; badge.textContent=item.category.toUpperCase(); top.append(source,badge);
    const title=document.createElement("h3"); title.textContent=item.title;
    const desc=document.createElement("p"); desc.className="description"; desc.textContent=item.description;
    const date=document.createElement("p"); date.className="date"; date.textContent=dateLabel(item);
    content.append(top,title,desc,date);
    const footer=document.createElement("div"); footer.className="card-footer";
    const author=document.createElement("span"); author.textContent="Posted by "+(item.author||"Campus Admin");
    const controls=document.createElement("div"); controls.className="card-controls";
    const like=document.createElement("button"); like.className="like-btn"; like.type="button"; like.setAttribute("aria-pressed","false");
    const heart=document.createElement("span"); heart.className="heart";
    const count=document.createElement("span"); count.className="like-count";
    const label=document.createElement("span"); label.textContent="Likes"; like.append(heart,count,label);
    const lk="campusVoiceLiked_"+item.id; let liked=false;
    try { liked=localStorage.getItem(lk)==="true"; } catch(e) {}
    function updateLike(){heart.textContent=liked?"♥":"♡";count.textContent=String((Number(item.likes)||0)+(liked?1:0));like.classList.toggle("liked",liked);like.setAttribute("aria-pressed",String(liked));}
    like.addEventListener("click",()=>{liked=!liked;try{localStorage.setItem(lk,String(liked));}catch(e){}updateLike();}); updateLike(); controls.append(like);
    const pin=document.createElement("button"); pin.className="pin-btn"; pin.type="button";
    let pinned=false; const pk="campusVoicePinned_"+item.id;
    try { pinned=localStorage.getItem(pk)==="true"; } catch(e) {}
    function updatePin(){pin.textContent=pinned?"📌 Pinned":"📍 Pin";pin.classList.toggle("pinned",pinned);pin.setAttribute("aria-pressed",String(pinned));card.classList.toggle("is-pinned",pinned);}
    pin.addEventListener("click",()=>{pinned=!pinned;try{localStorage.setItem(pk,String(pinned));}catch(e){}updatePin();if(currentView==="pinned")render();});
    updatePin(); controls.append(pin);
    if(user.role==="Admin"){
      const edit=document.createElement("button");edit.className="small-action";edit.textContent="Edit";edit.type="button";edit.addEventListener("click",()=>editItem(item.id));
      const del=document.createElement("button");del.className="small-action danger";del.textContent="Delete";del.type="button";del.addEventListener("click",()=>deleteItem(item.id));controls.append(edit,del);
    }
    footer.append(author,controls);card.append(content,footer);return card;
  }

  function isPinned(item){try{return localStorage.getItem("campusVoicePinned_"+item.id)==="true";}catch(e){return false;}}
  function render() {
    const term=$("#searchInput").value.toLowerCase().trim();
    let filtered=items.filter(canSee).filter(x=>category==="All"||x.category===category).filter(x=>[x.title,x.category,x.description,x.date,x.audience,x.author].join(" ").toLowerCase().includes(term));
    if(currentView==="events") filtered=filtered.filter(x=>x.category==="Events");
    if(currentView==="pinned") filtered=filtered.filter(isPinned);
    filtered.sort((a,b)=>(Number(isPinned(b))-Number(isPinned(a)))||((b.createdAt||0)-(a.createdAt||0)));
    $("#announcementContainer").replaceChildren(...filtered.map(makeCard));
    $("#resultCount").textContent=filtered.length+" announcement"+(filtered.length===1?"":"s");
    $("#noResults").hidden=filtered.length!==0;
    renderLatest(); renderCalendar();
  }
  function renderLatest(){
    const box=$("#latestAnnouncements"); if(!box)return;
    const latest=items.filter(canSee).slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,5);
    box.replaceChildren();
    if(!latest.length){box.textContent="No announcements published yet.";return;}
    latest.forEach(item=>{const b=document.createElement("button");b.type="button";b.className="latest-item";const title=document.createElement("strong");title.textContent=item.title;const meta=document.createElement("span");meta.textContent=item.category+" · "+dateLabel(item).replace("🕒 ","");b.append(title,meta);b.addEventListener("click",()=>{currentView="announcements";category="All";$("#searchInput").value=item.title;updateNav();render();$("#announcements").scrollIntoView({behavior:"smooth"});});box.append(b);});
  }
  function renderCalendar(){
    const grid=$("#calendarDays"),label=$("#calendarMonthLabel"); if(!grid||!label)return;
    label.textContent=calendarMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"});grid.replaceChildren();
    const firstDay=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);const offset=(firstDay.getDay()+6)%7;const days=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate();
    for(let i=0;i<offset;i++){const blank=document.createElement("span");blank.className="calendar-empty";grid.append(blank);}
    for(let d=1;d<=days;d++){const dateKey=calendarMonth.getFullYear()+"-"+String(calendarMonth.getMonth()+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");const b=document.createElement("button");b.type="button";b.className="calendar-day";b.textContent=d;const has=items.some(x=>canSee(x)&&x.date===dateKey);if(has)b.classList.add("has-event");b.addEventListener("click",()=>showCalendarDate(dateKey));grid.append(b);}
  }
  function showCalendarDate(dateKey){
    const box=$("#calendarSelectedInfo");const found=items.filter(x=>canSee(x)&&x.date===dateKey);box.replaceChildren();const heading=document.createElement("strong");heading.textContent=new Date(dateKey+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});box.append(heading);
    if(!found.length){const p=document.createElement("p");p.textContent="No announcements or events scheduled for this date.";box.append(p);return;}
    found.forEach(x=>{const p=document.createElement("p");p.textContent="• "+x.title+" ("+x.category+")";box.append(p);});
  }
  function updateNav(){ $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView)); }
  function goView(view){currentView=view;$("#searchInput").value="";category="All";$("#sidebarCategory").value="All";$$('.filter-btn').forEach(b=>b.classList.toggle("active",b.dataset.category==="All"));updateNav();render();if(view==="calendar")$("#calendarPanel").scrollIntoView({behavior:"smooth",block:"center"});else if(view==="announcements"||view==="events"||view==="pinned")$("#announcements").scrollIntoView({behavior:"smooth",block:"start"});else window.scrollTo({top:0,behavior:"smooth"});}
  function selectCategory(c){category=c;$("#sidebarCategory").value=c;$$(".filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.category===c));render();}
  function showApp(u){user=u;currentView="home";$("#loginView").hidden=true;$("#appView").hidden=false;$("#adminTools").hidden=user.role!=="Admin";$("#sidebarNewAnnouncementBtn").hidden=user.role!=="Admin";$("#roleBadge").textContent=user.role;$("#dashboardTitle").textContent=user.role==="Admin"?"Admin Dashboard":"Latest Announcements";$("#dashboardSubtitle").textContent=user.role==="Admin"?"Create, edit, delete and export announcements.":"Announcements available for your account.";$("#sessionLabel").textContent=user.name+" · "+user.role;$("#logoutBtn").hidden=false;render();}
  function showLogin(){user=null;$("#appView").hidden=true;$("#loginView").hidden=false;$("#logoutBtn").hidden=true;$("#sessionLabel").textContent="Welcome";$("#announcementFormPanel").hidden=true;$("#loginForm").reset();loginFields();}
  $("#loginForm").addEventListener("submit",e=>{
    e.preventDefault(); const role=$("#loginRole").value; let u;
    if(role==="Admin"){
      if($("#adminUsername").value.trim()!=="admin"||$("#adminPassword").value!=="Admin@123"){$("#loginError").textContent="Invalid admin username or password.";$("#loginError").hidden=false;return;}
      u={role:"Admin",name:"Campus Admin",id:"admin"};
    } else {
      const name=$("#personName").value.trim(), id=role==="Student"?$("#personId").value.trim().toUpperCase():$("#staffId").value.trim();
      if(!name||!id){$("#loginError").textContent="Please enter your name and ID.";$("#loginError").hidden=false;return;}
      u={role,name,id};
    }
    $("#loginError").hidden=true;try{localStorage.setItem(SESSION,JSON.stringify(u));}catch(e){}showApp(u);
  });
  $("#logoutBtn").addEventListener("click",()=>{try{localStorage.removeItem(SESSION);}catch(e){}showLogin();});
  $$(".filter-btn").forEach(b=>b.addEventListener("click",()=>{currentView="announcements";updateNav();selectCategory(b.dataset.category);}));
  $$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>goView(b.dataset.view)));
  $("#prevMonthBtn").addEventListener("click",()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderCalendar();});
  $("#nextMonthBtn").addEventListener("click",()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar();});
  $("#sidebarCategory").addEventListener("change",()=>selectCategory($("#sidebarCategory").value));
  $$(".sidebar-category").forEach(b=>b.addEventListener("click",()=>{selectCategory(b.dataset.category);$("#announcements").scrollIntoView({behavior:"smooth"});}));
  $("#searchInput").addEventListener("input",()=>{currentView="announcements";updateNav();render();});
  $("#quickSearchBtn").addEventListener("click",()=>{$("#searchSection").scrollIntoView({behavior:"smooth"});$("#searchInput").focus();});
  $("#showAllBtn").addEventListener("click",()=>{currentView="announcements";updateNav();$("#searchInput").value="";selectCategory("All");});
  $("#resetBtn").addEventListener("click",()=>{$("#searchInput").value="";selectCategory("All");});

  function openForm() {
    if(!user||user.role!=="Admin"){alert("Only admins can add announcements.");return;}
    $("#announcementForm").reset();$("#editAnnouncementId").value="";$("#formTitle").textContent="Create announcement";$("#announcementDate").value=new Date().toISOString().slice(0,10);$("#announcementFormPanel").hidden=false;$("#announcementFormPanel").scrollIntoView({behavior:"smooth"});
  }
  function editItem(id) {
    if(!user||user.role!=="Admin")return;const x=items.find(a=>a.id===id);if(!x)return;
    $("#editAnnouncementId").value=x.id;$("#formTitle").textContent="Edit announcement";$("#announcementTitle").value=x.title;$("#announcementCategory").value=x.category;$("#announcementDescription").value=x.description;$("#announcementDate").value=x.date;$("#announcementTime").value=x.time||"";$("#announcementAudience").value=x.audience||"Everyone";$("#announcementFormPanel").hidden=false;$("#announcementFormPanel").scrollIntoView({behavior:"smooth"});
  }
  function deleteItem(id) {if(!user||user.role!=="Admin")return;const x=items.find(a=>a.id===id);if(x&&confirm('Delete "'+x.title+'"?')){items=items.filter(a=>a.id!==id);save();render();}}
  $("#openAnnouncementFormBtn").addEventListener("click",openForm);
  $("#sidebarNewAnnouncementBtn").addEventListener("click",openForm);
  $("#closeFormBtn").addEventListener("click",()=>$("#announcementFormPanel").hidden=true);
  $("#cancelFormBtn").addEventListener("click",()=>{$("#announcementFormPanel").hidden=true;$("#announcementForm").reset();});
  $("#announcementForm").addEventListener("submit",e=>{
    e.preventDefault();if(!user||user.role!=="Admin"){alert("Only admins can publish announcements.");return;}
    const id=$("#editAnnouncementId").value, old=items.find(x=>x.id===id);
    const x={id:id||"announcement-"+Date.now(),category:$("#announcementCategory").value,title:$("#announcementTitle").value.trim(),description:$("#announcementDescription").value.trim(),date:$("#announcementDate").value,time:$("#announcementTime").value,audience:$("#announcementAudience").value,likes:old?old.likes:0,author:user.name,createdAt:old?old.createdAt:Date.now()};
    if(!x.title||!x.description||!x.date){alert("Please fill in title, description and date.");return;}
    items=old?items.map(a=>a.id===id?x:a):[...items,x];if(!save())return;
    $("#announcementForm").reset();$("#editAnnouncementId").value="";$("#announcementFormPanel").hidden=true;$("#searchInput").value="";selectCategory("All");alert(old?"Announcement updated.":"Announcement published.");
  });
  $("#exportBtn").addEventListener("click",()=>{
    if(!user||user.role!=="Admin")return;
    const blob=new Blob([JSON.stringify(items,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="campus-voice-announcements.json";a.click();URL.revokeObjectURL(url);
  });
  try {const saved=JSON.parse(localStorage.getItem(SESSION));if(saved&&saved.role&&saved.name)showApp(saved);else showLogin();}catch(e){showLogin();}
});
