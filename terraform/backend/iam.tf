# Deux roles distincts, principe ECS classique :
# - execution role : utilise par l'agent ECS lui-meme pour demarrer la
#   tache (pull l'image ECR, ecrit les logs, lit les secrets SSM avant que
#   le conteneur ne demarre)
# - task role : utilise par le code de l'application une fois demarree
#   (vide pour l'instant, complete en Phase 6 avec les permissions SQS)

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "ticketbus-ecs-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_task_execution_ssm" {
  statement {
    sid    = "ReadTicketbusSecrets"
    effect = "Allow"
    actions = [
      "ssm:GetParameters",
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/*",
    ]
  }
}

resource "aws_iam_role_policy" "ecs_task_execution_ssm" {
  name   = "read-ticketbus-ssm-parameters"
  role   = aws_iam_role.ecs_task_execution.id
  policy = data.aws_iam_policy_document.ecs_task_execution_ssm.json
}

resource "aws_iam_role" "ecs_task" {
  name               = "ticketbus-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}
