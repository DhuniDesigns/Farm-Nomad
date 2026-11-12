import { ChatsCircle } from "@phosphor-icons/react/dist/ssr";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function MessagesPage() {
  return (
    <ComingSoon
      icon={<ChatsCircle weight="duotone" className="size-6" />}
      release="release 2"
      title="Messages"
      body="Talk to the farm about an order, or to your driver on delivery day, without swapping phone numbers."
      points={["Message a farm about any listing or order", "Reach your driver while they're on the way", "Live updates, with notifications when you're away"]}
      topic="messages"
    />
  );
}
