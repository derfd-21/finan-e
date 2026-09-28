const KEY="odontagenda_consultas_v1";
const $=id=>document.getElementById(id);
let appointments=JSON.parse(localStorage.getItem(KEY)||"[]");
const pad=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
let selectedDate=iso(new Date());

function save(){localStorage.setItem(KEY,JSON.stringify(appointments));}
function formatDate(s){return new Intl.DateTimeFormat("pt-PT",{weekday:"long",day:"numeric",month:"long"}).format(new Date(s+"T12:00:00"))}
function statusLabel(s){return ({pendente:"Pendente",confirmada:"Confirmada",concluida:"Concluída",cancelada:"Cancelada"})[s]||s}
function render(){
  $("selectedDate").value=selectedDate;
  $("todayLabel").textContent=new Intl.DateTimeFormat("pt-PT",{dateStyle:"full"}).format(new Date());
  const search=$("search").value.toLowerCase(), filter=$("statusFilter").value;
  const list=appointments.filter(a=>a.date===selectedDate && (!search||a.patient.toLowerCase().includes(search)||a.procedure.toLowerCase().includes(search)) && (filter==="todos"||a.status===filter)).sort((a,b)=>a.time.localeCompare(b.time));
  $("agendaTitle").textContent=`Consultas de ${formatDate(selectedDate)}`;
  $("agendaSubtitle").textContent=`${list.length} ${list.length===1?"consulta":"consultas"} agendada${list.length===1?"":"s"}`;
  $("appointmentsList").innerHTML=list.map(a=>`
    <article class="appointment">
      <div class="time">${a.time}</div>
      <div>
        <div class="patient-name">${escapeHtml(a.patient)}</div>
        <div class="meta">${escapeHtml(a.procedure)}${a.phone?" · "+escapeHtml(a.phone):""}</div>
        ${a.notes?`<div class="meta">📝 ${escapeHtml(a.notes)}</div>`:""}
        <span class="badge ${a.status}">${statusLabel(a.status)}</span>
      </div>
      <div class="actions">
        <button class="small-btn" onclick="editAppointment('${a.id}')">Editar</button>
        <button class="small-btn" onclick="deleteAppointment('${a.id}')">Apagar</button>
      </div>
    </article>`).join("");
  $("emptyState").classList.toggle("hidden",list.length>0);
  const today=iso(new Date());
  $("todayCount").textContent=appointments.filter(a=>a.date===today&&a.status!=="cancelada").length;
  $("confirmedCount").textContent=appointments.filter(a=>a.status==="confirmada").length;
  $("pendingCount").textContent=appointments.filter(a=>a.status==="pendente").length;
  $("completedCount").textContent=appointments.filter(a=>a.status==="concluida").length;
  renderPatients();
}
function renderPatients(){
  const map=new Map();
  appointments.forEach(a=>{if(!map.has(a.patient))map.set(a.patient,a)});
  $("patientList").innerHTML=[...map.values()].sort((a,b)=>a.patient.localeCompare(b.patient)).map(a=>`
    <div class="patient"><strong>${escapeHtml(a.patient)}</strong><span>${escapeHtml(a.phone||"Sem telefone")}</span></div>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openModal(a=null){
  $("modal").classList.remove("hidden"); $("modalTitle").textContent=a?"Editar consulta":"Nova consulta";
  $("appointmentId").value=a?.id||"";
  $("patient").value=a?.patient||""; $("phone").value=a?.phone||"";
  $("date").value=a?.date||selectedDate; $("time").value=a?.time||"09:00";
  $("procedure").value=a?.procedure||"Consulta de avaliação"; $("status").value=a?.status||"pendente"; $("notes").value=a?.notes||"";
  setTimeout(()=>$("patient").focus(),50);
}
function closeModal(){$("modal").classList.add("hidden")}
function editAppointment(id){openModal(appointments.find(a=>a.id===id))}
function deleteAppointment(id){
  if(confirm("Apagar esta consulta?")){appointments=appointments.filter(a=>a.id!==id);save();render();}
}
$("newAppointmentBtn").onclick=()=>openModal();
$("closeModal").onclick=closeModal; $("cancelModal").onclick=closeModal;
$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};
$("selectedDate").onchange=e=>{selectedDate=e.target.value;render()};
$("prevDay").onclick=()=>{let d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()-1);selectedDate=iso(d);render()};
$("nextDay").onclick=()=>{let d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()+1);selectedDate=iso(d);render()};
$("search").oninput=render; $("statusFilter").onchange=render;
$("appointmentForm").onsubmit=e=>{
  e.preventDefault();
  const data={id:$("appointmentId").value||crypto.randomUUID(),patient:$("patient").value.trim(),phone:$("phone").value.trim(),date:$("date").value,time:$("time").value,procedure:$("procedure").value,status:$("status").value,notes:$("notes").value.trim()};
  const idx=appointments.findIndex(a=>a.id===data.id);
  if(idx>=0)appointments[idx]=data;else appointments.push(data);
  selectedDate=data.date;save();closeModal();render();
};
render();