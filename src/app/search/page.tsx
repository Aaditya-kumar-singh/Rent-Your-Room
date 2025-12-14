import { Metadata } from "next";
import RoomSearchWrapper from "@/components/rooms/RoomSearchWrapper";

export const metadata: Metadata = {
  title: "Search Rooms | Room Rental Platform",
  description:
    "Find and book the perfect room for rent. Search by location, price, amenities and more.",
};

export default function SearchPage() {
  return <RoomSearchWrapper />;
}
