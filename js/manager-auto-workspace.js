const node = (tag, text, cls) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (cls) element.className = cls;
  return element;
};
export function createManagerAutoStatus({ config, language = "en", action }) {
  const he=language==="he", t=(h,e)=>he?h:e;
  const enabled=config?.enabled;
  const card=node("section",undefined,"manager-auto-settings");
  const identity=node("div",undefined,"manager-auto-identity");
  identity.append(node("span","AUTO OPEN","manager-auto-kicker"),node("h4",t("פתיחה אוטומטית","Automatic opening")),node("p",t("ניהול הפתיחה האוטומטית למשתמשים שנרשמו במערכת.","Manage automatic opening for users enrolled on this system.")));
  const badge=node("span",enabled===true?t("מופעל","Enabled"):enabled===false?t("כבוי","Disabled"):t("המצב לא זמין","Status unavailable"),"manager-auto-status");
  badge.dataset.state=enabled===true?"enabled":enabled===false?"disabled":"unknown";
  const controls=node("div",undefined,"manager-auto-controls");
  controls.append(badge);
  if(action) controls.append(action);
  card.append(identity,controls);
  return card;
}
export function createManagerAutoPerson(person, language = "en") {
  const he=language==="he", t=(h,e)=>he?h:e;
  const name=person.name||t("משתמש רשום","Enrolled user");
  const row=node("article",undefined,"manager-auto-user");
  const avatar=node("span",name.trim().slice(0,1).toUpperCase(),"manager-auto-avatar");
  avatar.setAttribute("aria-hidden","true");
  const phone=person.localNumber ? (person.countryCode?`+${person.countryCode} ${person.localNumber}`:String(person.localNumber)) : "";
  const number=node("bdi",phone,"manager-auto-phone"); number.dir="ltr";
  const badge=node("span",person.allowed===false?t("הרשאת Auto Open כבויה","Auto Open permission disabled"):person.allowed===true?t("מורשה ל־Auto Open","Auto Open permitted"):t("רשום ל־Auto Open","Enrolled for Auto Open"),"manager-auto-user-badge"+(person.allowed===false?" is-disabled":""));
  row.append(avatar,node("strong",name),number,badge);
  row.dataset.search=`${name} ${person.countryCode||""}${person.localNumber||""} ${phone}`.toLocaleLowerCase();
  return row;
}
