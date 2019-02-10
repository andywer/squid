############
# Workflows

workflow "Build, Test and maybe Publish" {
  on = "push"
  resolves = ["Build", "Test", "Publish Latest", "Publish Testing"]
}

###########
# Filters

action "Production Version Tag" {
  uses = "actions/bin/filter@master"
  args = "tag v[0-9].[0-9].[0-9]"
}

action "Testing Version Tag" {
  uses = "actions/bin/filter@master"
  args = "tag *testing*"
}

##############
# Build Steps

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Build" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "run build"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "test"
}

action "Publish Latest" {
  needs = ["Production Version Tag", "Build", "Test"]
  uses = "actions/npm@master"
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}

action "Publish Testing" {
  needs = ["Testing Version Tag", "Build", "Test"]
  uses = "actions/npm@master"
  args = "publish --access public --tag testing"
  secrets = ["NPM_AUTH_TOKEN"]
}
