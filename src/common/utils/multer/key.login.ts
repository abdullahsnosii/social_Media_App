
export const loginTrialsKey = ({email}:{email:string})=>{
  return `User::${email}::Login`
}