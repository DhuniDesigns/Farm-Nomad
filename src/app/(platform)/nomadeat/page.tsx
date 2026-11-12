import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function NomadEatPage() {
  return (
    <ComingSoon
      icon={<ForkKnife weight="duotone" className="size-6" />}
      release="release 3"
      title="NomadEat"
      body="Ready meals cooked by local kitchens with produce from FarmNomad farms. Made for students and busy weeks, ordered alongside your groceries."
      points={["Meals from verified local kitchens", "Made with produce from farms on the platform", "Order with your groceries, one delivery"]}
      topic="nomadeat"
    />
  );
}
