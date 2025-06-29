/** Files Controller (Multer middleware):
 * To fetch the file/s from requests body form data and store it in memeory
 * Implemented using memory storage to gurantee that the file will not be written
 * until it's all corrsponding data stored.
 * Obly images files will be recived.
 */
import multer from 'multer'

const filesController = multer({

    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }
})

export default filesController