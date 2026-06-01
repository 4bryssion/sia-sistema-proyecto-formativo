export async function getDocumentTypes() {

    const response = await fetch("/../../data/selects/documentTypes.json");

    return response.json();
    
}