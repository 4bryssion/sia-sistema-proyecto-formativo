// (p49) CreateBrandPage se eliminó: era código muerto con ruta viva. El
// formulario de crear va incrustado en el propio listado (ListBrandPage), así
// que nadie navegaba a /dashboard/brands/create — pero la ruta respondía y
// mostraba un segundo formulario suelto, sin cabecera ni forma de volver.
export { default as ListBrandPage } from "./pages/ListBrandPage";

export { default as EditBrandPage } from "./pages/EditBrandPage";


