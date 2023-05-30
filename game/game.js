import crypto from 'crypto'
import Table from 'cli-table'

const isValid = (input) => {
	if (input.length < 3) console.log('Not enough parameters!\nPlease pass at least 3 parameters.\nExample: node game.js rock paper scissors')
	else if (input.length % 2 === 0) console.log('Invalid properties!\nTotal amount should be odd!\nExample: node game.js rock paper scissors lizard Spock')
	else if (hasDuplicates(input)) console.log('Invalid properties!\nParameters must be unique')
	if (input.length < 3 || input.length % 2 === 0 || hasDuplicates(input)) {
		return false
	}
	return true
}
const hasDuplicates = (input) => {
	const duplicates = input.filter((argument, index, arr) => arr.indexOf(argument) !== index)
	if (duplicates.length) return true
	return false
}

class Rules {
	constructor(parameters) {
		this.rules = this.#setRules(parameters)
	}
	#setRules(params) {
		const wins = Math.floor(params.length / 2), movesGraph = {}
		params.forEach((move, index, arr) => {
			movesGraph[move] = arr.slice((index + 1), index + (wins + 1))
			if (index + (wins + 1) > arr.length - 1) movesGraph[move] = [...movesGraph[move], ...arr.slice(0, wins - movesGraph[move].length)]
		})
		return movesGraph
	}
}
class RulesTable {
	constructor(rules) {
		this.rules = rules
		this.rulesTable = this.#setTable()
	}
	#setTable() {
		const header = [' v PC / User > '], rows = []
		Object.keys(this.rules).forEach(title => {
			header.push(title)
			rows.push(this.#setRow(title))
		})
		let result = new Table({ head: header })
		result.push(...rows)
		return result
	}
	#setRow(title) {
		const row = {}
		row[title] = []
		Object.keys(this.rules).forEach(move => {
			if (this.rules[title].includes(move)) row[title].push('WIN')
			else if (title === move) row[title].push('DRAW')
			else row[title].push('LOSE')
		})
		return row
	}
	show() {
		console.log(this.rulesTable.toString())
		console.log('Enter your move: ')
	}
}
class Security {
	constructor() {
		this.security = this.#generateSecurity()
	}
	#generateSecurity() {
		const key = crypto.generateKeySync('hmac', { length: 256 })
		const hmac = crypto.createHmac('SHA3-256', key)
		return {
			key: key.export().toString('hex'),
			hmac: hmac
		}
	}
}

class Game {
	constructor(moves) {
		this.moves = moves
		this.rules = new Rules(moves).rules
		this.controls = this.setControls()
		this.table = new RulesTable(this.rules)
		this.security = new Security().security
	}

	setRules() {
		const wins = Math.floor(this.moves.length / 2), movesGraph = {}
		this.moves.forEach((move, index, arr) => {
			movesGraph[move] = arr.slice((index + 1), index + (wins + 1))
			if (index + (wins + 1) > arr.length - 1) movesGraph[move] = [...movesGraph[move], ...arr.slice(0, wins - movesGraph[move].length)]
		})
		return movesGraph
	}
	setControls() {
		const controls = {}
		this.moves.forEach((move, index) => { controls[index + 1] = move })
		controls['0'] = 'Exit'
		controls['?'] = 'Help'
		return controls
	}
	makeMove() {
		const move = Math.ceil(Math.random() * this.moves.length)
		const hex = this.security.hmac.update(move.toString()).digest('hex')
		console.log(`HMAC: ${hex}`)
		return move
	}
	showControls() {
		let menu = 'Available moves:'
		Object.keys(this.controls).forEach((key) => { menu += `\n${key} - ${this.controls[key]}` })
		console.log(menu)
		console.log('Enter your move: ')
	}
	getUserInput(pcMove) {
		const stdin = process.stdin
		stdin.setEncoding('utf8')
		stdin.on('data', (input) => {
			const userInput = input.trim()
			if (userInput === '?') {
				this.table.show()
				return
			}
			this.handleUserInput(userInput, pcMove)
		})
	}
	handleUserInput(input, pcMove) {
		const moveIndex = Number(input)
		if (isNaN(moveIndex) || !this.isValidMoveIndex(moveIndex) && moveIndex !== 0) return this.showControls()
		if (moveIndex === 0) return process.exit(0)

		const userMove = this.controls[moveIndex]

		console.log(`Your move: ${userMove}`)
		console.log(`Computer move: ${this.controls[pcMove]}`)

		const result = this.getResult(moveIndex, pcMove)
		this.displayResult(result)

		console.log(`HMAC key: ${this.security.key}`)
		process.stdin.pause()
	}

	isValidMoveIndex(moveIndex) {
		return moveIndex >= 1 && moveIndex <= this.moves.length
	}
	getResult(userIndex, computerIndex) {
		const n = this.moves.length
		const diff = (n + userIndex - computerIndex) % n
		if (diff === 0) {
			return 'draw'
		} else if (diff <= n / 2) {
			return 'win'
		} else {
			return 'lose'
		}
	}
	displayResult(result) {
		if (result === 'win') {
			console.log('You win!')
		} else if (result === 'lose') {
			console.log('You lose!')
		} else {
			console.log('It\'s a draw!')
		}
	}
	play() {
		const pcMove = this.makeMove()
		this.showControls()
		this.getUserInput(pcMove)
	}
}

const input = process.argv.slice(2)
if (!isValid(input)) process.exit(-1)

const game = new Game(input)
game.play()