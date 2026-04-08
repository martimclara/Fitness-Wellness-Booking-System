import { TrainerList } from "@/components/features/trainers/trainer-list"

export default function TrainersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Our Trainers</h1>
        <p className="mt-2 text-muted-foreground">
          Find the right trainer for your fitness goals.
        </p>
      </div>
      <TrainerList />
    </div>
  )
}
