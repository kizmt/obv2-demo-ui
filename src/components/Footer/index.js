import Image from "next/image";
import { Badge } from "../ui/badge";
import OpenbookIcon from "/public/assets/images/openbook.png";
import { Separator } from "../ui/separator";


export const Footer = () => {
  return <div className="w-full border-t p-1 bg-background-over flex items-center justify-center gap-4 mt-16">
    <Separator orientation="vertical"/>
    <div className="flex items-center gap-2">
      <p className="text-xs text-muted-foreground">Trading powered by</p>
      <a href="https://twitter.com/openbookdex" target="_blank">
        <Badge variant={"outline"} className="flex items-center gap-2 rounded">
          <Image src={OpenbookIcon} width={16} height={16} alt={"Openbook"}/>
          <p>Openbook</p>
        </Badge>
      </a>
    </div>
  </div>
}