// WIFIGATE's AutoOpenArt.tsx visual vocabulary: #146BFF, rounded 3px
// strokes, pale pulse areas and context lines. Drawn as native SVG for web.
const ns = "http://www.w3.org/2000/svg";
function svgNode(tag, attrs = {}, text) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
export function managerTimingArt(method, values, language = "en") {
  const he = language === "he", t = (h,e) => he ? h : e;
  const svg = svgNode("svg", {viewBox:"0 0 420 132", role:"img", "aria-label":t("תרשים תזמון הפתיחה", "Opening timing diagram"), class:"manager-timing-art"});
  svg.append(svgNode("path", {d:"M20 94H400", fill:"none",stroke:"#cbd5e1","stroke-width":1.5,"stroke-dasharray":"3 6"}));
  const label = (x,y,text,blue=false) => svgNode("text", {x,y,"text-anchor":"middle",fill:blue?"#146BFF":"#64748b","font-size":12,"font-family":"Arial, sans-serif"},text);
  let d = "M20 94H35";
  if (method.startsWith("PULSE")) {
    const count = method === "PULSE" ? 1 : method === "PULSE_AFTER_PULSE" ? 2 : 3;
    const segments=[];
    for(let i=0;i<count;i++) {
      segments.push({pulse:true,index:i,value:Number(values[`pulseWidth${i+1}Millis`])});
      if(i<count-1) segments.push({pulse:false,value:Number(values[`timeBetweenPulses${i+1}Seconds`])});
    }
    const total=segments.reduce((sum,s)=>sum+(s.value>0?s.value:1),0);
    let x=35;
    for(const s of segments) {
      const width=28+(340-28*segments.length)*(s.value>0?s.value:1)/total;
      if(s.pulse) {
        svg.append(svgNode("rect",{x,y:42,width,height:52,fill:"#146BFF","fill-opacity":.12}));
        d+=`V42H${x+width}V94`;
        svg.append(label(x+width/2,32,`${s.value>0?s.value:"—"} ${t("שנ׳","sec")}`));
        svg.append(label(x+width/2,73,String(s.index+1),true));
      } else { d+=`H${x+width}`; svg.append(label(x+width/2,116,`${s.value>0?s.value:"—"} ${t("שנ׳","sec")}`)); }
      x+=width;
    }
    d+="H400";
  } else if (method === "TOGGLE") {
    d="M20 94H85V42H255V94H400";
    svg.append(label(85,120,t("לחיצה · פעיל","Press · on")),label(255,120,t("לחיצה · כבוי","Press · off")),label(170,30,t("נשאר פעיל עד לפקודה הבאה","On until the next command")));
  } else {
    d="M20 94H90V42H305V94H400";
    svg.append(label(90,120,t("לחיצה","Press")),label(305,120,t("שחרור","Release")),label(198,30,t("פעיל כל עוד לוחצים","Active while held")));
  }
  svg.append(svgNode("path",{d,fill:"none",stroke:"#146BFF","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"}));
  return svg;
}
export function managerFeatureArt(kind, language = "en") {
  const svg=svgNode("svg",{viewBox:"0 0 280 124",class:"manager-feature-art","aria-hidden":"true"});
  const path=(d,context=false)=>svgNode("path",{d,fill:"none",stroke:context?"#cbd5e1":"#146BFF","stroke-width":context?1.5:3,"stroke-linecap":"round","stroke-linejoin":"round"});
  svg.append(path("M18 108H262",true),svgNode("rect",{x:162,y:43,width:12,height:65,rx:3,fill:"white",stroke:"#146BFF","stroke-width":3}),svgNode("rect",{x:242,y:43,width:12,height:65,rx:3,fill:"white",stroke:"#146BFF","stroke-width":3}),path("M175 61H241V104H175M190 64V100M207 64V100M225 64V100",true));
  if(kind==="auto" || kind==="rf") {
    svg.append(svgNode("rect",{x:44,y:48,width:35,height:56,rx:7,fill:"white",stroke:"#146BFF","stroke-width":3}),path("M54 55H69M60 94H63"),path("M89 72Q120 40 150 72M96 82Q120 56 143 82",true));
  } else if(kind==="sensor") svg.append(path("M27 78H55L65 50L80 99L95 65H128"),path("M145 46Q116 58 145 72M151 39Q108 58 151 80",true));
  else if(kind==="wiring") svg.append(path("M35 48H79L120 90H146M35 90H79L120 48H146"),svgNode("circle",{cx:35,cy:48,r:5,fill:"#146BFF"}),svgNode("circle",{cx:35,cy:90,r:5,fill:"#146BFF"}));
  else if(kind==="override") svg.append(path("M35 100V60H118V100M48 60V37H106V60M62 40V26H92V40"),svgNode("circle",{cx:77,cy:78,r:7,fill:"#146BFF"}));
  else if(kind==="reset") svg.append(path("M116 57A38 38 0 1 0 119 86M116 34V60H91"));
  else {
    svg.append(svgNode("rect",{x:48,y:35,width:66,height:66,rx:8,fill:"#eef4ff",stroke:"#146BFF","stroke-width":3}),path("M38 48H48M38 66H48M38 84H48M114 48H124M114 66H124M114 84H124",true));
    if(kind==="firmware") svg.append(path("M81 87V48M68 62L81 48L94 62"));
    else svg.append(path("M64 50H98M64 65H98M64 80H88",true));
  }
  return svg;
}
export function managerAccessNoteArt(kind = "arrival") {
  const hero=kind === "arrival";
  const svg=svgNode("svg",{viewBox:hero?"0 0 264 124":"0 0 56 56",class:hero?"manager-arrival-art":"manager-note-art","aria-hidden":"true",fill:"none"});
  const group=svgNode("g",{stroke:"#146BFF","stroke-width":hero?2.5:2,"stroke-linecap":"round","stroke-linejoin":"round"});
  const path=(d,attrs={})=>svgNode("path",{d,...attrs});
  if(hero) group.append(path("M10 110H254M18 38H60M221 30H246",{opacity:.25,"stroke-width":1.3}),path("M151 108V24L187 10L223 24V108M161 31H171M183 31H193M205 31H215M161 45H171M183 45H193M205 45H215",{opacity:.4,"stroke-width":1.5}),path("M176 108V63H207V108",{fill:"#146BFF","fill-opacity":.06}),path("M176 63L162 69V114L176 108Z",{fill:"white"}),path("M168 86V92"),svgNode("rect",{x:28,y:38,width:48,height:72,rx:9,fill:"white"}),path("M44 45H60M47 103H57",{opacity:.4,"stroke-width":1.5}),svgNode("rect",{x:39,y:57,width:27,height:31,rx:4,fill:"#146BFF","fill-opacity":.07}),path("M45 65H59M45 71H59M45 77H53",{"stroke-width":1.5}),path("M86 91H107Q119 91 119 79V67Q119 55 132 55H146",{opacity:.4,"stroke-dasharray":"4 6"}));
  else if(kind === "person") group.append(svgNode("circle",{cx:22,cy:17,r:8}),path("M7 47C7 29 37 29 37 47"),svgNode("circle",{cx:43,cy:37,r:9,fill:"white"}),path("M39 37L42 40L47 34"));
  else if(kind === "location") group.append(path("M28 5C8 5 9 24 28 42C47 24 48 5 28 5Z",{fill:"#146BFF","fill-opacity":.06}),svgNode("circle",{cx:28,cy:19,r:6}),path("M12 48H44",{opacity:.4}));
  else group.append(svgNode("rect",{x:10,y:6,width:32,height:44,rx:6,fill:"#146BFF","fill-opacity":.06}),path("M20 17H34M20 25H34M20 33H29"),svgNode("circle",{cx:42,cy:40,r:10,fill:"white"}),path("M37 40H47M43 36L47 40L43 44"));
  svg.append(group); return svg;
}
