import { type ServicesMethods } from "@/server/db/schema";

export const ServicesData = {
  "Google Drive": {
    listenFilesAdded: {
      description: "Listening for files addes in your google drive folder",
    },
  },
  Discord: {
    postMessage: {
      description: "Post messages to your discord server",
    },
  },
  Email: {
    sendEmail: {
      description: "Send emails from your proper email provider",
    },
  },
  Facebook: {
    postContent: {
      description: "Post content in your facebook page or account",
    },
  },
  Gmail: {
    sendEmail: {
      description: "Send emails from your gmail account",
    },
  },
  Instagram: {
    postContent: {
      description: "Post content in your instagram account",
    },
  },
  Notion: {
    addBlock: {
      description: "Create blocks in your notion pages",
    },
  },
  OneDrive: {
    listenFilesAdded: {
      description: "Listening for files addes in your onedrive folder",
    },
  },
  Outlook: {
    sendEmail: {
      description: "Send emails from your outlook account",
    },
  },
  Slack: {
    postMessage: {
      description: "Post messages to your slack channels",
    },
  },
  Twitter: {
    postTweet: {
      description: "Post content in your twitter account",
    },
  },
  Youtube: {
    postContent: {
      description: "Post content for your youtube community",
    },
  },
  "Manual Trigger": {
    clickButton: {
      description: "Start manually your workflow",
    },
  },
} satisfies ServicesMethods<{ description: string }>;
