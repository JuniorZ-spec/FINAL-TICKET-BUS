const { SQSClient } = require("@aws-sdk/client-sqs");

// Region seule suffit : en credentials, le SDK prend automatiquement le
// role de la tache ECS (pas de cle statique a gerer ici).
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || "eu-west-3" });

module.exports = sqsClient;
