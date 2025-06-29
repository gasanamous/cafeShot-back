/**
 * TokenUtils class works like token handler, it can create a new token and verify existing ones
 */
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

class TokenUtils {

    static #JWT_KEY = process.env.JWT_KEY

    static createToken(payload, expireTime) {
        return jwt.sign(payload, this.#JWT_KEY, { expiresIn: expireTime })
    }

    static verifyToken = (token) => {
        return jwt.verify(token, this.#JWT_KEY)
    }
    static decodeToken = (token) => {
        return jwt.decode(token)
    }
}

export default TokenUtils