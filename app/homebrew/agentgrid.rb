class Agentgrid < Formula
  desc "Visual multi-agent orchestration for AI coding tools"
  homepage "https://github.com/naman10parikh/Energy"
  url "https://registry.npmjs.org/agentgrid/-/agentgrid-0.1.0.tgz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "agentgrid", shell_output("#{bin}/agentgrid --version")
  end
end
