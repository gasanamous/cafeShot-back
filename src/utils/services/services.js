import fs from 'fs';
import path from 'path';

// this function recive a word and return it with first letter capitalized ( ghassan => Ghassan )
const capitalizeFirstLetter = (str) => {
    str = str.toLowerCase()
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// this function convert variable name into readable label (ProductName => Product Name)
const formatVariabelNameToLabel = (key) => {
    key = key.replace(/_/g, ' ');

    key = key.replace(/([a-z])([A-Z])/g, '$1 $2');

    return key.charAt(0).toUpperCase() + key.slice(1);
}


const listFiles = async (req) => {

    const dirPath = path.join(__dirname)
    fs.readdir(dirPath, (err, files) => {
        if (err)
            return err
        return { files }
    })
}

export {
    capitalizeFirstLetter,
    formatVariabelNameToLabel,
    listFiles
}
