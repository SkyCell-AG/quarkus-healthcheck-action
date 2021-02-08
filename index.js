const core = require("@actions/core");
const proc = require("child_process");

function getHealthCheckStatus(applicationURL) {
  let retryConfig = `--retry 3 --retry-delay 5 --retry-connrefused`;
  let healthCheckRequest = `curl --fail ${applicationURL} ${retryConfig}`;
  let response = proc.execSync(healthCheckRequest).toString();
  core.info(response);
  return JSON.parse(response)
}

function sendNotificationToTeams(teamsWebHookURL, applicationURL) {
  const data = JSON.stringify({
    "@type": "MessageCard",
    "themeColor": "0076D7",
    "text": "Health check failed",
    "sections": [
      {
        "facts": [
          {
            "name": "Application:",
            "value": applicationURL
          }
        ]
      }
    ]
  })
  let params = `--header \"Content-Type: application/json\" --request POST`
  let teamsRequest = `curl ${params} --data '${data}' ${teamsWebHookURL}`;
  let response = proc.execSync(teamsRequest).toString();
  core.info(response);
}

let teamsWebHookURL = core.getInput("teamsWebHookURL", {required: true});
let applicationURL = core.getInput("url", {required: true});

try {
  core.info(`Health check of ${applicationURL}`);

  let healthCheckStatus = getHealthCheckStatus(applicationURL);
  if (healthCheckStatus.status === 'UP') {
    core.info("Success");
  } else {
    sendNotificationToTeams(teamsWebHookURL, applicationURL);
    core.setFailed(e.message);
  }
} catch (e) {
  console.error("Action failed with error", e);
  sendNotificationToTeams(teamsWebHookURL, applicationURL);
  core.setFailed(e.message);
}