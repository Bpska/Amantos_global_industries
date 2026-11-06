export const money=(value:number|string|undefined=0)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value)||0);
export const dateDay=(value:string|Date)=>new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric',weekday:'long'}).format(new Date(value));
export const shortDate=(value:string|Date)=>new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short'}).format(new Date(value));
export const apiError = (e: any): string => {
  const details = e?.response?.data?.error;
  if (Array.isArray(details)) {
    const messages = details
      .map((issue: any) => typeof issue?.message === 'string' ? issue.message : '')
      .filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  return e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';
};
export const normalizePage=<T>(raw:any)=>({data:raw?.data?.items??raw?.items??raw?.data??[],page:raw?.data?.page??raw?.page??1,totalPages:raw?.data?.totalPages??raw?.totalPages??1,total:raw?.data?.total??raw?.total??0,nextPage:raw?.data?.nextPage??raw?.nextPage});
