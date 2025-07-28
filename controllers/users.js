const bcrypt = require("bcrypt");

const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UsersController");
const generateJWT = require("../utils/generateJWT");

const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,32}/;

//跳脫字元\\- 改成寫 \- , 要跳脫避免與範圍運算混淆
const emailPattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
function isUndefined(value) {
	return value === undefined;
}

function isNotValidSting(value) {
	return typeof value !== "string" || value.trim().length === 0 || value === "";
}

class UsersController {
	static async postSignup(req, res, next) {
		try {
			const { name, email, password } = req.body;
			if (
				isUndefined(name) ||
				isNotValidSting(name) ||
				name.trim().length > 10 ||
				name.trim().length < 2 ||
				isUndefined(password) ||
				isNotValidSting(password)
			) {
				logger.warn("欄位未填寫正確");
				res.status(400).json({
					message: "欄位未填寫正確",
				});
				return;
			}
			//信箱驗證
			if (
				isUndefined(email) ||
				isNotValidSting(email) ||
				!emailPattern.test(email)
			) {
				logger.warn("Email格式不正確");
				res.status(400).json({
					message: "Email格式不正確",
				});
				return;
			}
			if (!passwordPattern.test(password)) {
				logger.warn(
					"建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字"
				);
				res.status(400).json({
					message: "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字",
				});
				return;
			}
			const userRepository = dataSource.getRepository('users');
			const existingUser = await userRepository.findOne({
				where: { email },
			});
			if (existingUser) {
				logger.warn("註冊失敗，Email 已被使用");
				res.status(409).json({
					message: "註冊失敗，Email 已被使用",
				});
				return;
			}
			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash(password, salt);
			const newUser = userRepository.create({
				name,
				email,
				role: "USER",
				password: hashPassword,
			});
			const savedUser = await userRepository.save(newUser);
			logger.info("新建立的使用者ID:", savedUser.id);
			res.status(201).json({
				status: "success",
				message: "註冊成功",
				data: {
					id: savedUser.id,
					name: savedUser.name,
					email: savedUser.email,
				}
			});
		} catch (error) {
			logger.error("建立使用者錯誤:", error);
			next(error);
		}
	}

	static async postSignin(req, res, next) {
		try {
			const { email, password } = req.body;
			if (
				isUndefined(email) ||
				isNotValidSting(email) ||
				!emailPattern.test(email) ||
				isUndefined(password) ||
				isNotValidSting(password)
			) {
				logger.warn("欄位未填寫正確");
				res.status(400).json({
					message: "欄位未填寫正確",
				});
				return;
			}
			if (!passwordPattern.test(password)) {
				logger.warn(
					"密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字"
				);
				res.status(400).json({
					message:
						"密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字",
				});
				return;
			}
			const userRepository = dataSource.getRepository("users");
			const existingUser = await userRepository.findOne({
				select: ["id", "name", "password", "role"],
				where: { email },
			});

			if (!existingUser) {
				res.status(400).json({
					message: "使用者不存在或密碼輸入錯誤",
				});
				return;
			}
			logger.info(`使用者資料: ${JSON.stringify(existingUser)}`);
			const isMatch = await bcrypt.compare(password, existingUser.password);
			if (!isMatch) {
				res.status(400).json({
					message: "使用者不存在或密碼輸入錯誤",
				});
				return;
			}
			const token = await generateJWT(
				{
					id: existingUser.id,
					role: existingUser.role,
				},
				config.get("secret.jwtSecret"),
				{
					expiresIn: `${config.get("secret.jwtExpiresDay")}`,
				}
			);

			res.status(200).json({
				status: "success",
				message: "登入成功",
				data: {
					token,
					user: {
						name: existingUser.name,
					},
				},
			});
		} catch (error) {
			logger.error("登入錯誤:", error);
			next(error);
		}
	}

	static async getProfile(req, res, next) {
		try {
			const { id } = req.user;
			const userRepository = dataSource.getRepository("users");
			const user = await userRepository.findOne({
				select: ["name", "tel", "address"],
				where: { id },
			});
			res.status(200).json({
				message: "取得成功",
				data: {
					user,
				},
			});
		} catch (error) {
			logger.error("取得使用者資料錯誤:", error);
			next(error);
		}
	}

	static async putProfile(req, res, next) {
		try {
			const { id } = req.user;
			const { name, tel, address } = req.body;
			if (
				isUndefined(name) ||
				isNotValidSting(name) ||
				isUndefined(tel) ||
				isNotValidSting(tel) ||
				isUndefined(address) ||
				isNotValidSting(address)
			) {
				logger.warn("欄位未填寫正確");
				res.status(400).json({
					message: "欄位未填寫正確",
				});
				return;
			}
			const taiwanMobileRegex = /^09\d{8}$/;
			if (!taiwanMobileRegex.test(tel)) {
				logger.warn("手機號碼不符合規則");
				res.status(400).json({
					message: "手機號碼不符合規則",
				});
				return;
			}
			if (address.length > 320) {
				logger.warn("地址欄位超出最大字元，最大字元為 30 字元");
				res.status(400).json({
					message: "地址欄位超出最大字元，最大字元為 30 字元",
				});
				return;
			}
			const userRepository = dataSource.getRepository("users");
			const user = await userRepository.findOne({
				select: ["name", "tel", "address"],
				where: {
					id,
				},
			});
			if (user.name === name && user.tel === tel && user.address === address) {
				res.status(400).json({
					message: "沒有任何資料變更",
				});
				return;
			}

			const updatedResult = await userRepository.update(
				{
					id,
				},
				{
					name,
					tel,
					address,
				}
			);
			if (updatedResult.affected === 0) {
				res.status(400).json({
					message: "更新使用者資料失敗",
				});
				return;
			}
			const result = await userRepository.findOne({
				select: ["name", "tel", "address"],
				where: {
					id,
				},
			});
			res.status(200).json({
				data: {
					user: result,
				},
				message: "您的資料變更成功",
			});
		} catch (error) {
			logger.error("取得使用者資料錯誤:", error);
			next(error);
		}
	}

	static async putPassword(req, res, next) {
		try {
			const { id } = req.user;
			const {
				password,
				new_password: newPassword,
				confirm_new_password: confirmNewPassword,
			} = req.body;
			if (
				isUndefined(password) ||
				isNotValidSting(password) ||
				isUndefined(newPassword) ||
				isNotValidSting(newPassword) ||
				isUndefined(confirmNewPassword) ||
				isNotValidSting(confirmNewPassword)
			) {
				logger.warn("欄位未填寫正確");
				res.status(400).json({
					message: "欄位未填寫正確",
				});
				return;
			}
			if (
				!passwordPattern.test(password) ||
				!passwordPattern.test(newPassword) ||
				!passwordPattern.test(confirmNewPassword)
			) {
				logger.warn(
					"密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字"
				);
				res.status(400).json({
					message:
						"密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長32個字",
				});
				return;
			}
			if (newPassword === password) {
				logger.warn("新密碼不能與舊密碼相同");
				res.status(400).json({
					message: "新密碼不能與舊密碼相同",
				});
				return;
			}
			if (newPassword !== confirmNewPassword) {
				logger.warn("新密碼與驗證新密碼不一致");
				res.status(400).json({
					message: "新密碼與驗證新密碼不一致",
				});
				return;
			}
			const userRepository = dataSource.getRepository("users");
			const existingUser = await userRepository.findOne({
				select: ["password"],
				where: { id },
			});
			const isMatch = await bcrypt.compare(password, existingUser.password);
			if (!isMatch) {
				res.status(400).json({
					message: "舊密碼輸入錯誤",
				});
				return;
			}
			const salt = await bcrypt.genSalt(10);
			const newHashPassword = await bcrypt.hash(newPassword, salt);
			const updatedResult = await userRepository.update(
				{
					id,
				},
				{
					password: newHashPassword,
				}
			);
			if (updatedResult.affected === 0) {
				res.status(400).json({
					message: "更新密碼失敗",
				});
				return;
			}
			res.status(200).json({
				message: "更新成功",
			});
		} catch (error) {
			logger.error("取得使用者資料錯誤:", error);
			next(error);
		}
	}
}

module.exports = UsersController;
