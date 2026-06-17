export async function getDocumentTypes(){

    const res = await fetch("/../../data/selects/documentTypes.json")
    
    return res.json()

}