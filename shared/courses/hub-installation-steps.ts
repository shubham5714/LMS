import type { InstallationStep } from "./securonix-siem-config"

export const HUB_INSTALLATION_STEPS: readonly InstallationStep[] = [
  {
    id: "step-verify-prerequisites",
    title: "1. Verify Prerequisites",
    blocks: [
      { type: "text", content: "Ensure:" },
      {
        type: "list",
        items: [
          "You have received the Securonix Hub Agent download link.",
          "/tmp has at least 10 GB free space.",
        ],
      },
      { type: "text", content: "Check available space:" },
      { type: "code", content: "df -h /tmp" },
    ],
  },
  {
    id: "step-validate-connectivity",
    title: "2. Validate Connectivity",
    blocks: [
      { type: "text", content: "Switch to root:" },
      { type: "code", content: "sudo su" },
      { type: "text", content: "Test connectivity to Unified Defense SIEM:" },
      { type: "code", content: "curl -k -v https://snyprtrng#.securonix.net/Snypr" },
      { type: "text", content: "Test Kafka broker connectivity:" },
      {
        type: "code",
        content:
          "kafka-topics.sh --bootstrap-server <broker-host>:<broker-port> --describe",
      },
    ],
  },
  {
    id: "step-verify-server-sizing",
    title: "3. Verify Server Sizing",
    blocks: [
      { type: "text", content: "Check memory:" },
      { type: "code", content: "free -h" },
      { type: "text", content: "Check CPU information:" },
      { type: "code", content: "cat /proc/cpuinfo" },
      { type: "text", content: "Check disk partitions and verify /Securonix mount:" },
      { type: "code", content: "df -h" },
    ],
  },
  {
    id: "step-create-securonix-user",
    title: "4. Create the Securonix User",
    blocks: [
      { type: "text", content: "Switch to root:" },
      { type: "code", content: "sudo su" },
      { type: "text", content: "Create the user:" },
      { type: "code", content: "adduser securonix" },
      { type: "text", content: "Set password:" },
      { type: "code", content: "passwd securonix" },
      { type: "text", content: "Grant sudo privileges:" },
      { type: "code", content: "usermod -aG wheel securonix" },
    ],
  },
  {
    id: "step-configure-selinux",
    title: "5. Configure SELinux",
    blocks: [
      { type: "text", content: "Check current mode:" },
      { type: "code", content: "getenforce" },
      { type: "text", content: "If not Permissive, edit:" },
      { type: "code", content: "vi /etc/selinux/config" },
      { type: "text", content: "Update:" },
      { type: "code", content: "SELINUX=permissive" },
      { type: "text", content: "Restart the server:" },
      { type: "code", content: "shutdown -r now" },
    ],
  },
  {
    id: "step-download-extract",
    title: "6. Download and Extract Hub Installer",
    blocks: [
      { type: "text", content: "Navigate to installation directory:" },
      { type: "code", content: "cd /Securonix" },
      { type: "text", content: "Download installer package:" },
      {
        type: "code",
        content:
          'curl -u <emailaddress>:<password> "<presigned URL from securonix download portal>" -o SNYPR_SecuronixHubAgent_installer_package_<version>.tar.gz',
      },
      { type: "text", content: "Set ownership if required:" },
      {
        type: "code",
        content:
          "chown securonix:securonix SNYPR_SecuronixHubAgent_installer_package_<version>.tar.gz",
      },
      { type: "text", content: "Extract package:" },
      {
        type: "code",
        content: "tar -xvf SNYPR_SecuronixHubAgent_installer_package_<version>.tar.gz",
      },
      { type: "text", content: "Navigate to extracted files:" },
      { type: "code", content: "cd /Securonix/installables/<extracted package>/RIN/" },
    ],
  },
  {
    id: "step-update-config",
    title: "7. Update Configuration Files",
    blocks: [
      { type: "text", content: "Update installer.properties:" },
      {
        type: "code",
        content: `INSTALL_MODE=Install
USER_INSTALL_DIR=/Securonix
SNYPR_TENANT_TYPE="ISOLATED" or "MSSP"
SNYPR_PASSWORD=<your password>`,
      },
      { type: "text", content: "Update:" },
      { type: "code", content: "Ingester/conf/ingestercloud.properties" },
      { type: "text", content: "If using SSL/Kerberos:" },
      {
        type: "list",
        items: [
          "Copy certificate files (server.jks, truststore.jks)",
          "Update: Ingester/conf/sslconfig.properties",
        ],
      },
    ],
  },
  {
    id: "step-pre-install-validation",
    title: "8. Run Pre-Installation Validation",
    blocks: [
      { type: "text", content: "Execute:" },
      { type: "code", content: "sh validation.sh pre-check" },
      {
        type: "text",
        content: "Review all failures and resolve them before proceeding.",
      },
    ],
  },
  {
    id: "step-validate-install-config",
    title: "9. Validate Installation Configuration",
    blocks: [
      { type: "text", content: "Run:" },
      { type: "code", content: "sh validation.sh prepare-to-install" },
      { type: "text", content: "When prompted, enter:" },
      { type: "code", content: "/Securonix" },
      { type: "text", content: "Provide the password when requested." },
      { type: "text", content: "The validation should end with:" },
      {
        type: "code",
        content:
          "Info: To Install Securonix Hub Agent, please execute the command as securonix user.",
      },
    ],
  },
  {
    id: "step-install-agent",
    title: "10. Install the Securonix Hub Agent",
    blocks: [
      { type: "text", content: "Execute:" },
      { type: "code", content: "./SecuronixHub.bin" },
      { type: "text", content: "Expected success message:" },
      {
        type: "code",
        content: "The Installation of Securonix Hub is complete.",
      },
      { type: "text", content: "Known harmless message:" },
      {
        type: "code",
        content: 'Cannot run program "/bin/sh": error=0, Failed to exec spawn helper....',
      },
    ],
  },
  {
    id: "step-post-install-validation",
    title: "11. Perform Post-Installation Validation",
    blocks: [
      { type: "text", content: "Run:" },
      { type: "code", content: "sh validation.sh post-check" },
      { type: "text", content: "If you receive:" },
      {
        type: "code",
        content: "ERROR: INGESTER_HOME environment variable not set.",
      },
      { type: "text", content: "Run:" },
      { type: "code", content: "source /home/securonix/.bash_profile" },
      { type: "text", content: "Then rerun:" },
      { type: "code", content: "sh validation.sh post-check" },
    ],
  },
  {
    id: "step-start-services",
    title: "12. Start Services (If Required)",
    blocks: [
      { type: "text", content: "Return to root:" },
      { type: "code", content: "exit" },
      {
        type: "text",
        content: "Start the required Hub services as instructed by the validation output.",
      },
    ],
  },
  {
    id: "step-verify-registration",
    title: "13. Verify Hub Registration in SIEM",
    blocks: [
      {
        type: "text",
        content: "Log in to the Unified Defense SIEM Console and navigate to:",
      },
      {
        type: "text",
        content: "Menu → Administration → Settings → Manage Ingesters",
      },
      { type: "text", content: "Verify:" },
      {
        type: "list",
        items: [
          "The new Securonix Hub Agent appears.",
          "Status is healthy.",
          "Communication with SIEM is successful.",
        ],
      },
    ],
  },
] as const
