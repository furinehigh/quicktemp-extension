function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}



const checkJSONValidity = (json) => {
  try {
    return JSON.parse(json)
  } catch (e) {
    return e.message
  }
}
const checkEmailValidity = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export { capitalizeFirst, checkJSONValidity, checkEmailValidity }