export function logout(){
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}