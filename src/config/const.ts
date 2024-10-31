import { env } from "@/env";
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

export const LINKS_CONNECTIONS = {
  "Google Drive": `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.NEXT_PUBLIC_BASE_URL + "/api/connections/callback/drive")}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/drive")}&access_type=offline`,

  Discord: `https://discord.com/oauth2/authorize?response_type=code&client_id=${env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.NEXT_PUBLIC_BASE_URL + "/api/connections/callback/discord")}&scope=guilds+bot&permissions=52224`,
} as Record<keyof ServicesMethods, string>;

export const ServicesStringSelector = {
  "Google Drive": {
    listenFilesAdded: [{ name: "", value: "" }],
  },
  Discord: {
    postMessage: [],
  },
  Email: {
    sendEmail: [{ name: "", value: "" }],
  },
  Facebook: {
    postContent: [{ name: "", value: "" }],
  },
  Gmail: {
    sendEmail: [{ name: "", value: "" }],
  },
  Instagram: {
    postContent: [{ name: "", value: "" }],
  },
  Notion: {
    addBlock: [{ name: "", value: "" }],
  },
  OneDrive: {
    listenFilesAdded: [{ name: "", value: "" }],
  },
  Outlook: {
    sendEmail: [{ name: "", value: "" }],
  },
  Slack: {
    postMessage: [{ name: "", value: "" }],
  },
  Twitter: {
    postTweet: [{ name: "", value: "" }],
  },
  Youtube: {
    postContent: [{ name: "", value: "" }],
  },
  "Manual Trigger": {
    clickButton: [{ name: "Manual content", value: "manual.content" }],
  },
} as ServicesMethods<{ value: string; name: string }[]>;
