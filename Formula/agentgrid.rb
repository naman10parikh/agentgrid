class Agentgrid < Formula
  desc "Spawn a grid of AI coding agents in one command"
  homepage "https://github.com/naman10parikh/agentgrid"
  url "https://registry.npmjs.org/@namanparikh/agentgrid/-/agentgrid-2.0.0.tgz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node@18"
  depends_on "tmux"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "2.0.0", shell_output("#{bin}/agentgrid --version")
  end
end
