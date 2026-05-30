export const getAppData = () => {
  return JSON.parse(localStorage.getItem("appData") || '{"classes": []}');
};

export const saveAppData = (data: any) => {
  localStorage.setItem("appData", JSON.stringify(data));
};