import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import YAML from 'yamljs';


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const mainDocs = YAML.load(path.join(__dirname, '../Docs/mainDocs.yaml'))
const tableDocs = YAML.load(path.join(__dirname, '../Docs/tableDocs.yaml'))
const menuDocs = YAML.load(path.join(__dirname, '../Docs/menuDocs.yaml'))
const appReviewDocs = YAML.load(path.join(__dirname, '../Docs/appReviewDocs.yaml'))
const orderDocs = YAML.load(path.join(__dirname, '../Docs/orderDocs.yaml'))
const managerDocs = YAML.load(path.join(__dirname, '../Docs/managerDocs.yaml'))
const sessionDocs = YAML.load(path.join(__dirname, '../Docs/sessionDocs.yaml'))

mainDocs.paths = {
    ...mainDocs.paths,
    ...tableDocs.paths,
    ...menuDocs.paths,
    ...appReviewDocs.paths,
    ...orderDocs.paths,
    ...managerDocs.paths,
    ...sessionDocs.paths
};


export default mainDocs;
