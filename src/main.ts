import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    
    const time = (new Date()).toTimeString();
    core.info(`Hello ${nameToGreet}! The time is ${time}`);
    
    // Set outputs for other workflow steps to use
    core.setOutput('greeting', `Hello ${nameToGreet}!`);
    core.setOutput('time', time);
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();
