import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/home/myPage/avatar";
import { ContributionGraph } from "../../../components/home/myPage/contribution-graph";

export default function MyPage() {
  const user = {
    name: "user1",
    email: "user1@naver.com",
    avatar: "/hello-kitty-cartoon-avatar.jpg",
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user.avatar || "/placeholder.svg"}
              alt={user.name}
            />
            <AvatarFallback className="text-2xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {user.name}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="bg-card rounded-xl border p-6">
        <ContributionGraph />
      </div>
    </div>
  );
}
