import chalk from "chalk";
import {
  playSound,
  setSoundFile,
  disableAllSounds,
  getSoundConfig,
} from "../lib/sound.js";

export function cmdSound(event?: string, file?: string): void {
  if (!event || event === "list") {
    const config = getSoundConfig();
    console.log(`\n${chalk.bold("Sounds")}\n`);
    console.log(`  ${chalk.green("done:")}     ${config["done"]}`);
    console.log(`  ${chalk.yellow("waiting:")}  ${config["waiting"]}`);
    console.log(`  ${chalk.blue("subagent:")} ${config["subagent"]}`);
    console.log(`\n  ${chalk.cyan("agentgrid sound done ~/Music/tada.mp3")}`);
    console.log(
      `  ${chalk.dim("macOS: Glass Hero Tink Purr Pop Ping Submarine Morse Blow")}\n`,
    );
    return;
  }

  if (event === "off") {
    disableAllSounds();
    console.log(chalk.magenta("[agentgrid]") + " Sounds off");
    return;
  }

  if (event === "test") {
    console.log(chalk.magenta("[agentgrid]") + " Testing...");
    console.log(`  ${chalk.green("Done:")}`);
    playSound("done");
    setTimeout(() => {
      console.log(`  ${chalk.yellow("Waiting:")}`);
      playSound("waiting");
      setTimeout(() => {
        console.log(`  ${chalk.blue("Sub-agent:")}`);
        playSound("subagent");
        setTimeout(() => {
          console.log(chalk.magenta("[agentgrid]") + " Done");
        }, 1000);
      }, 1000);
    }, 1000);
    return;
  }

  // Set a specific sound
  if (!file) {
    console.error(
      chalk.red("[agentgrid]") +
        " Usage: agentgrid sound <done|waiting|subagent> <file>",
    );
    process.exit(1);
  }

  const validEvents = ["done", "waiting", "subagent", "sub_agent"];
  if (!validEvents.includes(event)) {
    console.error(
      chalk.red("[agentgrid]") + " Events: done, waiting, subagent",
    );
    process.exit(1);
  }

  const normalizedEvent = event === "sub_agent" ? "subagent" : event;
  setSoundFile(normalizedEvent, file);
  console.log(
    chalk.magenta("[agentgrid]") +
      ` Set ${chalk.bold(normalizedEvent)} → ${file}`,
  );
  playSound(normalizedEvent);
}
