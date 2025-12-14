"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
  };
  images: string[];
  amenities: string[];
}

export default function FeaturedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedRooms = async () => {
      try {
        const response = await fetch("/api/rooms?limit=6&featured=true");
        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms || []);
        }
      } catch (error) {
        console.error("Error fetching featured rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedRooms();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <div className="h-8 w-64 bg-muted animate-pulse mx-auto rounded-md" />
            <div className="h-4 w-96 bg-muted animate-pulse mx-auto rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
              >
                <div className="h-56 bg-muted animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                  <div className="flex justify-between pt-4">
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Rooms
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover our handpicked selection of premium rooms in prime
            locations, tailored for your comfort.
          </p>
        </div>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  {room.images && room.images.length > 0 ? (
                    <Image
                      src={room.images[0]}
                      alt={room.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground shadow-sm">
                    For Rent
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {room.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground mb-4 text-sm">
                      <svg className="w-4 h-4 mr-1 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{room.location.city}, {room.location.address}</span>
                    </div>

                    {/* Amenities Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {room.amenities?.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md">
                          {amenity}
                        </span>
                      ))}
                      {(room.amenities?.length || 0) > 3 && (
                        <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="text-2xl font-bold text-primary">₹{room.monthlyRent.toLocaleString()}</p>
                    </div>
                    <Link
                      href={`/rooms/${room._id}`}
                      className="group/btn relative overflow-hidden rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium shadow-md transition-all hover:shadow-lg hover:bg-primary/90"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Featured Rooms Yet
            </h3>
            <p className="text-muted-foreground mb-8">
              Check back soon for our curated selection of premium rooms.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Browse All Rooms
            </Link>
          </div>
        )}

        {rooms.length > 0 && (
          <div className="text-center mt-16">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-primary"
            >
              View All Rooms
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
