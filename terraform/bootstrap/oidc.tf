# Permet à GitHub Actions d'assumer un role IAM via un jeton OIDC de courte
# durée signé par GitHub — aucune clé d'accès AWS statique à stocker en secret.

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restreint aux workflows qui tournent sur main/develop — pas de PR de
    # fork ou de branche arbitraire qui pourrait assumer ce role.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_repo}:ref:refs/heads/develop",
      ]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  name               = "gha-ticketbus-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}
