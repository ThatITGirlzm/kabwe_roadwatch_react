import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import "./App.css";


type Report = {
  id: number; code: string; type: number; title: string; desc: string;
  sev: number; st: number; la: number; lo: number; team: string;
  ver: string; at: string; ts?: number;
  hist: { o: string; n: string; note: string; by: string; at: string }[];
  alt: string; photo: string;
};
type Staff = { n: string; r: string; ro: boolean };
type Pin = [number, number];

const ST = ["New", "Under review", "Assigned", "In progress", "Resolved"];
const GL = ["!", "?", "A", "…", "✓"];
const SEV = ["Low", "Medium", "High"];
const TYPES = ["Pothole", "Damaged road surface", "Road edge failure"];
const TEAMS = ["Roads team", "Works team", "Maintenance crew A"];
const B = { n: -14.40, s: -14.49, w: 28.40, e: 28.50 };
const W = 600, H = 380;
const ROADS = "M0 120 L150 100 L300 150 L450 120 L600 150 M120 0 L150 100 L190 230 L330 280 L440 300 L600 330 M300 150 L330 280 M0 300 L190 230 M450 120 L440 300 L520 380 M300 0 L300 150";
const xy = (la: number, lo: number): [number, number] => [(lo-B.w)/(B.e-B.w)*W, (B.n-la)/(B.n-B.s)*H];
const ll = (x: number, y: number): Pin => [+(B.n-y/H*(B.n-B.s)).toFixed(5), +(B.w+x/W*(B.e-B.w)).toFixed(5)];
const now = () => new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const area = (la: number, lo: number) => {
  const a: [string, number, number][] = [["Kawama",-14.435,28.43],["Makululu",-14.47,28.475],["Railways",-14.445,28.455],["Chowa",-14.465,28.415]];
  let b = a[0], dist = 1e9;
  a.forEach(p => { const k = Math.hypot(la-p[1],lo-p[2]); if(k<dist){dist=k;b=p;} });
  return b[0] + " (demo area)";
};
const seed = (id:number,type:number,sev:number,st:number,la:number,lo:number,team:string,parts:string[]):Report => ({
  id, code:"KRD-"+String(id).padStart(5,"0"), type, title:parts[0], desc:parts[1], sev, st, la, lo, team,
  ver:st>0?"Verified":"Not yet reviewed", at:parts[2],
  hist:[{o:"",n:ST[0],note:"Report received (demo record)",by:"System",at:parts[2]}].concat(st>0?[{o:ST[0],n:ST[st],note:"Updated (demo record)",by:"Demo officer",at:parts[2]}]:[]),
  alt:"",photo:""
});
const initialReports:Report[] = [
  seed(21,0,2,1,-14.4635,28.4165,"","Large pothole,Near the Chowa demo market stalls,2 Oct 2026".split(",")),
  seed(22,1,0,2,-14.4452,28.4568,"Works team","Damaged surface,Worn surface by the Railways demo crossing,1 Oct 2026".split(",")),
  seed(23,2,1,3,-14.4712,28.4741,"Roads team","Road edge failure,Edge crumbling beside the Makululu demo clinic,30 Sep 2026".split(",")),
  seed(24,0,2,0,-14.4338,28.4305,"","Deep pothole on feeder road,Wide hole near the Kawama demo school entrance,3 Oct 2026".split(",")),
  seed(19,1,1,4,-14.4501,28.4399,"Roads team","Resolved surface crack,Repaired in demo scenario,20 Sep 2026".split(","))
];

function Badge({ status }: { status:number }) {
  return <span className={`badge t${status}`}><span aria-hidden="true">{GL[status]}</span> {ST[status]}</span>;
}
function MapView({ id, title, desc, pins=[], pin, selected, onPick, onKey, pick=false }: {
  id:string; title:string; desc:string; pins?:Report[]; pin?:Pin; selected?:number|null;
  onPick?:(e:React.MouseEvent<SVGSVGElement>)=>void; onKey?:(e:KeyboardEvent<SVGSVGElement>)=>void; pick?:boolean;
}) {
  return <svg className="map" id={id} viewBox={`0 0 ${W} ${H}`} role={pick?"application":"group"} aria-labelledby={`${id}t ${id}d`} tabIndex={pick?0:undefined} onClick={onPick} onKeyDown={onKey}>
    <title id={`${id}t`}>{title}</title><desc id={`${id}d`}>{desc}</desc>
    <path d={ROADS} fill="none" stroke="var(--rb)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d={ROADS} fill="none" stroke="var(--road)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    {[["Kawama",-14.435,28.43],["Makululu",-14.47,28.475],["Railways",-14.445,28.455],["Chowa",-14.465,28.415]].map((a:any) => {
      const p=xy(a[1],a[2]); return <text key={a[0]} className="lbl" x={p[0]-24} y={p[1]+34}>{a[0]} (demo)</text>;
    })}
    {pins.map(r=>{const p=xy(r.la,r.lo);return <g key={r.id} className={`mk${selected===r.id?" sel":""}`} tabIndex={0} role="button" data-id={r.id} aria-label={`${r.code}, ${r.title}, ${SEV[r.sev]} severity, status ${ST[r.st]}, ${area(r.la,r.lo)}. Press Enter to open details.`} onClick={e=>{e.stopPropagation();(e.currentTarget as SVGGElement).dispatchEvent(new CustomEvent("roadwatch-open",{bubbles:true,detail:r.id}));}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();(e.currentTarget as SVGGElement).dispatchEvent(new CustomEvent("roadwatch-open",{bubbles:true,detail:r.id}));}}}>
      <circle className={`c${r.st}`} cx={p[0]} cy={p[1]} r="14"/><text x={p[0]} y={p[1]+5}>{GL[r.st]}</text></g>})}
    {pin && <g aria-hidden="true"><circle cx={xy(pin[0],pin[1])[0]} cy={xy(pin[0],pin[1])[1]} r="14" fill="var(--s0)" stroke="var(--tx)" strokeWidth="3"/><circle cx={xy(pin[0],pin[1])[0]} cy={xy(pin[0],pin[1])[1]} r="4" fill="#fff"/></g>}
  </svg>;
}

export default function App() {
  const [page,setPage]=useState(location.hash.slice(1)||"report");
  const [reports,setReports]=useState(initialReports);
  const [next,setNext]=useState(25);
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem("rw-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}catch{return "light"}});
  const [toast,setToast]=useState("");
  const [pin,setPin]=useState<Pin>([-14.4452,28.4568]);
  const [selected,setSelected]=useState<number|null>(null);
  const [staff,setStaff]=useState<Staff|null>(null);
  const [filters,setFilters]=useState({st:"",sv:"",ty:"",from:""});
  const [trackCode,setTrackCode]=useState(()=>{try{return sessionStorage.getItem("rw-code")||""}catch{return ""}});
  const [trackResult,setTrackResult]=useState<Report|null>(null);
  const [submitted,setSubmitted]=useState<Report|null>(null);
  const [title,setTitle]=useState(""); const [description,setDescription]=useState("");
  const [defectType,setDefectType]=useState("0"); const [severity,setSeverity]=useState("1");
  const [latitude,setLatitude]=useState("-14.4452"); const [longitude,setLongitude]=useState("28.4568");
  const [photo,setPhoto]=useState<File|null>(null); const [photoAlt,setPhotoAlt]=useState("");
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [loginName,setLoginName]=useState(""); const [loginRole,setLoginRole]=useState("Road maintenance officer");
  const [editStatus,setEditStatus]=useState("0"); const [editTeam,setEditTeam]=useState(""); const [editVerify,setEditVerify]=useState("Not yet reviewed"); const [actionNote,setActionNote]=useState("");
  const active=reports.find(r=>r.id===selected)||null;

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme);try{localStorage.setItem("rw-theme",theme)}catch{}},[theme]);
  useEffect(()=>{const f=()=>{const h=location.hash.slice(1);setPage(["report","track","staff"].includes(h)?h:"report");setSelected(null);};window.addEventListener("hashchange",f);return()=>window.removeEventListener("hashchange",f)},[]);
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(""),6000);return()=>clearTimeout(t)},[toast]);
  useEffect(()=>{if(page==="track" && trackCode){const r=reports.find(x=>x.code===trackCode.trim().toUpperCase())||null;setTrackResult(r);}},[page]);
  useEffect(()=>{if(active){setEditStatus(String(active.st));setEditTeam(active.team);setEditVerify(active.ver);setActionNote("");setErrors({});}},[selected]);
  useEffect(()=>{document.title=({report:"Report a defect",track:"Track a report",staff:"Staff area"} as Record<string,string>)[page]+" – Kabwe RoadWatch"},[page]);
  useEffect(()=>{const f=(e:Event)=>setSelected(Number((e as CustomEvent).detail));document.addEventListener("roadwatch-open",f);return()=>document.removeEventListener("roadwatch-open",f)},[]);

  const filtered=useMemo(()=>reports.filter(r=>(filters.st===""||r.st===+filters.st)&&(filters.sv===""||r.sev===+filters.sv)&&(filters.ty===""||r.type===+filters.ty)&&(!filters.from||(r.ts||Date.parse(r.at))>=Date.parse(filters.from))),[reports,filters]);
  const go=(p:string)=>{location.hash=p;setPage(p);setSelected(null)};
  const flash=(m:string)=>setToast(m);
  const movePin=(p:Pin)=>{setPin(p);setLatitude(String(p[0]));setLongitude(String(p[1]));};
  const mapKeyboard=(e:KeyboardEvent<SVGSVGElement>)=>{const delta:Record<string,Pin>={ArrowUp:[.0015,0],ArrowDown:[-.0015,0],ArrowLeft:[0,-.0015],ArrowRight:[0,.0015]};const d=delta[e.key];if(!d)return;e.preventDefault();movePin([Math.min(B.n,Math.max(B.s,pin[0]+d[0])),Math.min(B.e,Math.max(B.w,pin[1]+d[1]))]);};
  const reportSubmit=(e:FormEvent)=>{e.preventDefault();const er:Record<string,string>={};const la=parseFloat(latitude),lo=parseFloat(longitude);
    if(title.trim().length<5)er.ti="Enter a short title of at least 5 characters.";
    if(description.trim().length<10)er.de="Enter a description of at least 10 characters.";
    if(isNaN(la)||isNaN(lo)||la>B.n||la<B.s||lo<B.w||lo>B.e)er.la=`Choose a location inside the demo map area (latitude ${B.s} to ${B.n}, longitude ${B.w} to ${B.e}).`;
    if(photo){if(!["image/jpeg","image/png","image/webp"].includes(photo.type))er.ph="This file type is not supported. Choose a JPEG, PNG or WebP image.";else if(photo.size>5242880)er.ph="This photo is larger than 5 MB. Choose a smaller image.";else if(photoAlt.trim().length<5)er.al="Describe the photo in at least 5 characters.";}
    setErrors(er);if(Object.keys(er).length)return;
    const r:Report={id:next,code:"KRD-"+String(next).padStart(5,"0"),type:+defectType,title:title.trim(),desc:description.trim(),sev:+severity,st:0,la,lo,team:"",ver:"Not yet reviewed",ts:Date.now(),at:now(),hist:[{o:"",n:"New",note:"Report received",by:"Resident",at:now()}],alt:photoAlt.trim(),photo:photo?URL.createObjectURL(photo):""};
    setReports(old=>[r,...old]);setNext(n=>n+1);setSubmitted(r);flash("Report submitted. Reference code "+r.code);
  };
  const lookup=()=>{const r=reports.find(x=>x.code===trackCode.trim().toUpperCase())||null;setTrackResult(r);if(!r)setErrors({rc:"No report found with that code. Check the code and try again."});else setErrors({});};
  const signIn=(e:FormEvent)=>{e.preventDefault();if(loginName.trim().length<2){setErrors({nm:"Enter your name."});return;}setStaff({n:loginName.trim(),r:loginRole,ro:loginRole==="Supervisor (view only)"});setErrors({});flash("Signed in as "+loginName.trim());};
  const saveUpdate=(e:FormEvent)=>{e.preventDefault();if(!active||!staff)return;const ns=+editStatus;if((ns!==active.st||editTeam!==active.team)&&actionNote.trim().length<3){setErrors({un:"Add an action note of at least 3 characters to record this change."});return;}
    if(ns===active.st&&editTeam===active.team&&editVerify===active.ver){flash("No changes to save.");return;}
    setReports(old=>old.map(r=>r.id!==active.id?r:{...r,st:ns,team:editTeam,ver:editVerify,hist:[...r.hist,{o:ST[r.st],n:ST[ns],note:actionNote.trim()||"Verification updated",by:staff.n,at:now()}]}));setErrors({});flash(`Saved. ${active.code} is now ${ST[ns]}.`);
  };

  return <>
    <a className="skip" href="#main">Skip to main content</a>
    <header className="top"><div className="bar">
      <div className="brand">Kabwe RoadWatch<small>Road defect reporting and maintenance tracking</small></div>
      <nav aria-label="Main"><ul>
        <li><a href="#report" data-nav="report" aria-current={page==="report"?"page":undefined}>Report a defect</a></li>
        <li><a href="#track" data-nav="track" aria-current={page==="track"?"page":undefined}>Track a report</a></li>
        <li><a href="#staff" data-nav="staff" aria-current={page==="staff"?"page":undefined}>Staff area</a></li>
      </ul></nav>
      <button type="button" className="btn themebtn" id="theme" aria-label={`Switch to ${theme==="dark"?"light":"dark"} mode`} onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?"Light mode":"Dark mode"}</button>
    </div></header>
    <main id="main" tabIndex={-1}>
      {page==="report" && submitted && <><h1 id="h" tabIndex={-1}>Report submitted</h1><div className="card"><p>Your reference code is:</p><p><span className="ref" aria-label={`Reference code ${submitted.code.split("").join(" ")}`}>{submitted.code}</span></p><p>Keep this code. Use it on the “Track a report” page to see progress. This is a demo, so the report is stored only in this browser tab.</p><div className="row"><a className="btn" href="#track" style={{textDecoration:"none",display:"inline-block"}} onClick={()=>{setTrackCode(submitted.code);try{sessionStorage.setItem("rw-code",submitted.code)}catch{}}}>Track this report</a><button type="button" className="btn alt" id="again" onClick={()=>{setSubmitted(null);setTitle("");setDescription("");setPhoto(null);setPhotoAlt("");setErrors({});}}>Report another defect</button></div></div></>}
    {page==="report" && !submitted && <><h1 id="h" tabIndex={-1}>Report a road defect</h1><p>Tell us where the road is damaged. You will get a reference code to check progress later. Do not include personal details.</p>
        <form id="rf" noValidate onSubmit={reportSubmit}>
          <div className="card"><fieldset><legend>Type of defect</legend><div className="opts">{TYPES.map((t,i)=><label key={t}><input type="radio" name="ty" value={i} checked={defectType===String(i)} onChange={()=>setDefectType(String(i))}/> {t}</label>)}</div></fieldset>
          <fieldset><legend>How severe is it?</legend><div className="opts">{SEV.map((t,i)=><label key={t}><input type="radio" name="sv" value={i} checked={severity===String(i)} onChange={()=>setSeverity(String(i))}/> {t}</label>)}</div></fieldset>
          <div className="field"><label htmlFor="ti">Short title</label><p className="hint" id="ti-h">For example: Deep pothole near the school entrance.</p><input id="ti" maxLength={80} aria-describedby="ti-h ti-e" autoComplete="off" value={title} onChange={e=>setTitle(e.target.value)} aria-invalid={!!errors.ti}/><p className="err" id="ti-e">{errors.ti}</p></div>
          <div className="field"><label htmlFor="de">Description</label><p className="hint" id="de-h">Describe the defect and a nearby landmark.</p><textarea id="de" maxLength={400} aria-describedby="de-h de-e" value={description} onChange={e=>setDescription(e.target.value)} aria-invalid={!!errors.de}/><p className="err" id="de-e">{errors.de}</p></div></div>
          <div className="card"><h2>Pin the location</h2><p className="hint" id="mh">Select the map to place the pin, or focus the map and use the arrow keys to move it. You can also type coordinates below.</p>
            <MapView id="pm" pick title="Map to pin the road defect location" desc={`Illustrative demo map of Kabwe with four labelled demo areas. The pin is currently at latitude ${pin[0]} and longitude ${pin[1]}.`} pin={pin} onKey={mapKeyboard} onPick={e=>{const r=e.currentTarget.getBoundingClientRect();movePin(ll((e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H));}}/>
            <div className="grid g2" style={{marginTop:".8rem"}}><div className="field"><label htmlFor="la">Latitude</label><input id="la" inputMode="decimal" aria-describedby="la-e" value={latitude} onChange={e=>setLatitude(e.target.value)} onBlur={()=>{const a=parseFloat(latitude),b=parseFloat(longitude);if(!isNaN(a)&&!isNaN(b)&&a<=B.n&&a>=B.s&&b>=B.w&&b<=B.e)movePin([a,b]);}} aria-invalid={!!errors.la}/><p className="err" id="la-e">{errors.la}</p></div><div className="field"><label htmlFor="lo">Longitude</label><input id="lo" inputMode="decimal" aria-describedby="lo-e" value={longitude} onChange={e=>setLongitude(e.target.value)} onBlur={()=>{const a=parseFloat(latitude),b=parseFloat(longitude);if(!isNaN(a)&&!isNaN(b)&&a<=B.n&&a>=B.s&&b>=B.w&&b<=B.e)movePin([a,b]);}}/><p className="err" id="lo-e"></p></div></div>
          </div>
          <div className="card"><h2>Photo (optional)</h2><div className="field"><label htmlFor="ph">Add a photo of the defect</label><p className="hint" id="ph-h">JPEG, PNG or WebP, up to 5 MB.</p><input id="ph" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="ph-h ph-e" onChange={e=>setPhoto(e.target.files?.[0]||null)}/><p className="err" id="ph-e">{errors.ph}</p></div><div className="field"><label htmlFor="al">Describe the photo for people who cannot see it</label><input id="al" maxLength={150} aria-describedby="al-e" value={photoAlt} onChange={e=>setPhotoAlt(e.target.value)}/><p className="err" id="al-e">{errors.al}</p></div></div>
          <button className="btn" id="sb" type="submit">Submit road defect report</button>
        </form>
      </>}
      {page==="track" && <><h1 id="h" tabIndex={-1}>Track a report</h1><p>Enter the reference code you received, for example KRD-00024. Only a safe status summary is shown.</p><form id="tf" noValidate className="card" onSubmit={e=>{e.preventDefault();lookup();}}><div className="field"><label htmlFor="rc">Reference code</label><input id="rc" value={trackCode} autoComplete="off" aria-describedby="rc-e" onChange={e=>setTrackCode(e.target.value)} aria-invalid={!!errors.rc}/><p className="err" id="rc-e">{errors.rc}</p></div><button className="btn" type="submit">Look up report</button></form>
        {trackResult && <section className="card" aria-labelledby="rt"><h2 id="rt">{trackResult.code}</h2><p><Badge status={trackResult.st}/></p><dl><dt>Defect type</dt><dd>{TYPES[trackResult.type]}</dd><dt>Severity</dt><dd>{SEV[trackResult.sev]}</dd><dt>Area</dt><dd>{area(trackResult.la,trackResult.lo)}</dd><dt>Reported</dt><dd>{trackResult.at}</dd></dl><h3>Progress history</h3><History report={trackResult} staff={!!staff}/></section>}
      </>}
      {page==="staff" && !staff && <><h1 id="h" tabIndex={-1}>Staff sign-in</h1><div className="banner">Demo sign-in only. Any name works. Real authentication and role checks will be enforced by the backend.</div><form id="lf" noValidate className="card" onSubmit={signIn}><div className="field"><label htmlFor="nm">Your name</label><input id="nm" autoComplete="name" value={loginName} onChange={e=>setLoginName(e.target.value)} aria-describedby="nm-e" aria-invalid={!!errors.nm}/><p className="err" id="nm-e">{errors.nm}</p></div><div className="field"><label htmlFor="rl">Role</label><select id="rl" value={loginRole} onChange={e=>setLoginRole(e.target.value)}><option>Road maintenance officer</option><option>Supervisor (view only)</option><option>System administrator</option></select></div><button className="btn" type="submit">Sign in</button></form></>}
      {page==="staff" && staff && <><div className="row" style={{justifyContent:"space-between"}}><h1 id="h" tabIndex={-1}>Road maintenance overview</h1><div className="row"><span>Signed in: {staff.n}, {staff.r}</span><button className="btn alt" id="so" type="button" onClick={()=>{setStaff(null);setSelected(null);flash("Signed out");}}>Sign out</button></div></div>
        <div className="banner">Demonstration workspace with synthetic sample reports.</div><section aria-labelledby="dh"><h2 id="dh">Dashboard summary</h2><div id="dash"><h3 className="vh">Counts by status</h3><div className="grid g3">{ST.map((s,i)=><div className="stat" key={s}><b>{reports.filter(r=>r.st===i).length}</b><Badge status={i}/></div>)}</div><div className="grid g3" style={{marginTop:".8rem"}}>{SEV.map((s,i)=><div className="stat" key={s}><b>{reports.filter(r=>r.sev===i&&r.st<4).length}</b>Open, {s.toLowerCase()} severity</div>)}</div><h3 style={{marginTop:"1rem"}}>Recent submissions</h3><ul>{reports.slice(0,3).map(r=><li key={r.id}>{r.code} {r.title}, {ST[r.st]}</li>)}</ul></div></section>
        <section className="card" aria-labelledby="fh"><h2 id="fh">Filter reports</h2><div className="grid g3"><div><label htmlFor="fs">Status</label><select id="fs" value={filters.st} onChange={e=>setFilters(f=>({...f,st:e.target.value}))}><option value="">All statuses</option>{ST.map((s,i)=><option value={i} key={s}>{s}</option>)}</select></div><div><label htmlFor="fv">Severity</label><select id="fv" value={filters.sv} onChange={e=>setFilters(f=>({...f,sv:e.target.value}))}><option value="">All severities</option>{SEV.map((s,i)=><option value={i} key={s}>{s}</option>)}</select></div><div><label htmlFor="ft">Defect type</label><select id="ft" value={filters.ty} onChange={e=>setFilters(f=>({...f,ty:e.target.value}))}><option value="">All types</option>{TYPES.map((s,i)=><option value={i} key={s}>{s}</option>)}</select></div><div><label htmlFor="fd">Reported since</label><input id="fd" type="date" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value}))}/></div></div></section>
        <div className="grid g2"><section className="card" aria-labelledby="mh2"><h2 id="mh2">Defect map</h2><MapView id="sm" title="Map of reported road defects" desc={`Illustrative demo map of Kabwe showing ${filtered.length} reported defects as markers. The report queue table lists the same reports.`} pins={filtered} selected={selected}/><p className="hint">Markers show status by colour and symbol. Every marker is also listed in the table.</p></section>
          <section className="card" aria-labelledby="lh"><h2 id="lh">Report queue</h2><p id="cnt" aria-live="polite">{filtered.length} {filtered.length===1?"report":"reports"} shown.</p><div className="tablewrap" id="tbl">{filtered.length?<table><caption className="vh">Road defect reports</caption><thead><tr><th scope="col">Reference and issue</th><th scope="col">Severity</th><th scope="col">Area</th><th scope="col">Status</th><th scope="col">Team</th><th scope="col">Action</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td>{r.code} {r.title}</td><td>{SEV[r.sev]}</td><td>{area(r.la,r.lo)}</td><td><Badge status={r.st}/></td><td>{r.team||"Unassigned"}</td><td><button type="button" className="btn alt" data-open={r.id} aria-label={`Open details for ${r.code}, ${r.title}`} onClick={()=>setSelected(r.id)}>Open</button></td></tr>)}</tbody></table>:<p>No reports match these filters. Clear a filter to see more.</p>}</div></section></div>
        {active && <section className="card" aria-labelledby="dt"><h2 id="dt" tabIndex={-1}>{active.code}: {active.title}</h2><p><Badge status={active.st}/></p><dl><dt>Defect type</dt><dd>{TYPES[active.type]}</dd><dt>Severity</dt><dd>{SEV[active.sev]}</dd><dt>Description</dt><dd>{active.desc}</dd><dt>Reported location</dt><dd>{active.la}, {active.lo}, {area(active.la,active.lo)}</dd><dt>Verification</dt><dd>{active.ver}</dd><dt>Assigned team</dt><dd>{active.team||"Unassigned"}</dd></dl>{active.photo&&<img src={active.photo} alt={active.alt} style={{maxWidth:"20rem",width:"100%",marginTop:".6rem",borderRadius:"6px"}}/>}
          {staff.ro?<p className="banner">Your role can view reports but not change them.</p>:<><h3 style={{marginTop:"1rem"}}>Review and update</h3><form id="uf" noValidate onSubmit={saveUpdate}><div className="grid g3"><div className="field"><label htmlFor="uv">Verification outcome</label><select id="uv" value={editVerify} onChange={e=>setEditVerify(e.target.value)}><option>Not yet reviewed</option><option>Verified</option><option>Could not verify</option></select></div><div className="field"><label htmlFor="ut">Assign to</label><select id="ut" value={editTeam} onChange={e=>setEditTeam(e.target.value)}><option value="">Unassigned</option>{TEAMS.map(t=><option key={t}>{t}</option>)}</select></div><div className="field"><label htmlFor="us">Status</label><select id="us" value={editStatus} onChange={e=>setEditStatus(e.target.value)}>{ST.map((s,i)=><option value={i} key={s}>{s}</option>)}</select></div></div><div className="field"><label htmlFor="un">Action note</label><p className="hint" id="un-h">Required when the status or team changes.</p><textarea id="un" aria-describedby="un-h un-e" value={actionNote} onChange={e=>setActionNote(e.target.value)}/><p className="err" id="un-e">{errors.un}</p></div><button className="btn" type="submit">Save update</button></form></>}
          <h3 style={{marginTop:"1rem"}}>Status history</h3><History report={active} staff/>
        </section>}
      </>}
    </main>
    <footer><p>Competition prototype for Tech Clash 2026, Tech for Kabwe. All reports, places and staff sign-in are synthetic demonstration data. Locations are reported points, not surveyed road assets. No council endorsement is claimed.</p></footer>
    <div id="toast" className="toast" role="status" aria-live="polite" hidden={!toast}>{toast}</div>
  </>;
}

function History({report,staff}:{report:Report;staff:boolean}) {
  return <div className="tablewrap"><table><caption className="vh">Status history for {report.code}</caption><thead><tr><th scope="col">When</th><th scope="col">Change</th><th scope="col">Note</th></tr></thead><tbody>{report.hist.slice().reverse().map((h,i)=><tr key={i}><td>{h.at}</td><td>{h.o?h.o+" to ":""}{h.n}</td><td>{h.note}{staff?` (${h.by})`:""}</td></tr>)}</tbody></table></div>;
}
