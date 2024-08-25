import { cn } from "@/lib/utils";
import { type LucideProps, PuzzleIcon } from "lucide-react";

type SidebarIconsProps = { selected: boolean };

export const Icons = {
  logo: PuzzleIcon,
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        fill="currentColor"
      />
    </svg>
  ),
  // home: ({ selected }: SidebarIconsProps) => (
  //   <svg
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <path
  //       fillRule="evenodd"
  //       clipRule="evenodd"
  //       d="M2 11.3361C2 10.4857 2.36096 9.67518 2.99311 9.10625L9.9931 2.80625C11.134 1.77943 12.866 1.77943 14.0069 2.80625L21.0069 9.10625C21.639 9.67518 22 10.4857 22 11.3361V19C22 20.6569 20.6569 22 19 22H16L15.9944 22H8.00558L8 22H5C3.34315 22 2 20.6569 2 19V11.3361Z"
  //       className={cn(
  //         "fill-[#C0BFC4] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-primary dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <path
  //       d="M9 16C9 14.8954 9.89543 14 11 14H13C14.1046 14 15 14.8954 15 16V22H9V16Z"
  //       className={cn(
  //         "fill-[#5B5966] transition-all group-hover:fill-[#D3E0FB] dark:fill-[#C0BFC4] dark:group-hover:fill-[#9F54FF]",
  //         { "fill-[#D3E0FB] dark:!fill-[#9F54FF]": selected },
  //       )}
  //     />
  //   </svg>
  // ),
  // workflows: ({ selected }: SidebarIconsProps) => (
  //   <svg
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <path
  //       d="M15.0034 4.69724C15.451 2.17765 12.2728 0.692639 10.6273 2.65246L3.58895 11.0353C2.22322 12.6619 3.37965 15.1429 5.50357 15.1429H9.7351L8.99616 19.3027C8.54859 21.8223 11.7267 23.3073 13.3722 21.3475L20.4107 12.9647C21.7764 11.3381 20.62 8.85714 18.496 8.85714H14.2645L15.0034 4.69724Z"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "!fill-[#7540A9] dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //   </svg>
  // ),
  // settings: ({ selected }: SidebarIconsProps) => (
  //   <svg
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <path
  //       d="M7.99243 4.78709C8.49594 4.50673 8.91192 4.07694 9.09416 3.53021L9.48171 2.36754C9.75394 1.55086 10.5182 1 11.3791 1H12.621C13.4819 1 14.2462 1.55086 14.5184 2.36754L14.906 3.53021C15.0882 4.07694 15.5042 4.50673 16.0077 4.78709C16.086 4.83069 16.1635 4.87553 16.2403 4.92159C16.7349 5.21857 17.3158 5.36438 17.8811 5.2487L19.0828 5.00279C19.9262 4.8302 20.7854 5.21666 21.2158 5.96218L21.8368 7.03775C22.2672 7.78328 22.1723 8.72059 21.6012 9.36469L20.7862 10.2838C20.4043 10.7144 20.2392 11.2888 20.2483 11.8644C20.2498 11.9548 20.2498 12.0452 20.2483 12.1356C20.2392 12.7111 20.4043 13.2855 20.7862 13.7162L21.6012 14.6352C22.1723 15.2793 22.2672 16.2167 21.8368 16.9622L21.2158 18.0378C20.7854 18.7833 19.9262 19.1697 19.0828 18.9971L17.8812 18.7512C17.3159 18.6356 16.735 18.7814 16.2403 19.0784C16.1636 19.1244 16.086 19.1693 16.0077 19.2129C15.5042 19.4933 15.0882 19.9231 14.906 20.4698L14.5184 21.6325C14.2462 22.4491 13.4819 23 12.621 23H11.3791C10.5182 23 9.75394 22.4491 9.48171 21.6325L9.09416 20.4698C8.91192 19.9231 8.49594 19.4933 7.99243 19.2129C7.91409 19.1693 7.83654 19.1244 7.7598 19.0784C7.2651 18.7814 6.68424 18.6356 6.11895 18.7512L4.91726 18.9971C4.07387 19.1697 3.21468 18.7833 2.78425 18.0378L2.16326 16.9622C1.73283 16.2167 1.82775 15.2793 2.39891 14.6352L3.21393 13.7161C3.59585 13.2854 3.7609 12.7111 3.75179 12.1355C3.75035 12.0452 3.75035 11.9548 3.75179 11.8644C3.76091 11.2889 3.59585 10.7145 3.21394 10.2838L2.39891 9.36469C1.82775 8.72059 1.73283 7.78328 2.16326 7.03775L2.78425 5.96218C3.21468 5.21665 4.07387 4.8302 4.91726 5.00278L6.11903 5.24871C6.68431 5.36439 7.26517 5.21857 7.75986 4.9216C7.83658 4.87554 7.91411 4.83069 7.99243 4.78709Z"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-[#7540A9] dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <path
  //       fillRule="evenodd"
  //       clipRule="evenodd"
  //       d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
  //       className={cn(
  //         "fill-[#5B5966] transition-all group-hover:fill-primary dark:fill-[#C0BFC4] dark:group-hover:fill-[#9F54FF]",
  //         { "fill-[#BD8AFF] dark:!fill-[#7540A9]": selected },
  //       )}
  //     />
  //   </svg>
  // ),
  // connections: ({ selected }: SidebarIconsProps) => (
  //   <svg
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <rect
  //       x="3"
  //       y="3"
  //       width="8"
  //       height="8"
  //       rx="3"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-primary dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <rect
  //       x="3"
  //       y="13"
  //       width="8"
  //       height="8"
  //       rx="3"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-primary dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <rect
  //       x="13"
  //       y="3"
  //       width="8"
  //       height="8"
  //       rx="3"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-primary dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <rect
  //       x="13"
  //       y="13"
  //       width="8"
  //       height="8"
  //       rx="3"
  //       className={cn(
  //         "fill-[#5B5966] transition-all group-hover:fill-[#BD8AFF] dark:fill-[#C0BFC4] dark:group-hover:fill-[#9F54FF]",
  //         { "fill-[#BD8AFF] dark:!fill-[#7540A9]": selected },
  //       )}
  //     />
  //   </svg>
  // ),
  // billing: ({ selected }: SidebarIconsProps) => (
  //   <svg
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <rect
  //       x="2"
  //       y="4"
  //       width="20"
  //       height="16"
  //       rx="3"
  //       className={cn(
  //         "fill-[#BABABB] transition-all group-hover:fill-primary dark:fill-[#353346] dark:group-hover:fill-[#C8C7FF]",
  //         { "fill-primary dark:!fill-[#C8C7FF]": selected },
  //       )}
  //     />
  //     <path
  //       fillRule="evenodd"
  //       clipRule="evenodd"
  //       d="M22 10H2V8H22V10Z"
  //       className={cn(
  //         "fill-[#5B5966] transition-all group-hover:fill-[#BD8AFF] dark:fill-[#C0BFC4] dark:group-hover:fill-[#9F54FF]",
  //         { "fill-[#BD8AFF] dark:!fill-primary": selected },
  //       )}
  //     />
  //     <path
  //       fillRule="evenodd"
  //       clipRule="evenodd"
  //       d="M4 15C4 14.4477 4.44772 14 5 14H11C11.5523 14 12 14.4477 12 15C12 15.5523 11.5523 16 11 16H5C4.44772 16 4 15.5523 4 15Z"
  //       className={cn(
  //         "fill-[#5B5966] transition-all group-hover:fill-[#BD8AFF] dark:fill-[#C0BFC4] dark:group-hover:fill-[#9F54FF]",
  //         { "fill-[#BD8AFF] dark:!fill-primary": selected },
  //       )}
  //     />
  //   </svg>
  // ),
};
