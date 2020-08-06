import { run } from "./lib"

process.on("unhandledRejection", (err) => {
	console.error(err, "error")
	throw new Error(`Exiting due to unhandled promise rejection`)
})

run()

