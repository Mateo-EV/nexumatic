import SettingsForm from "./_components/SettingsForm";

export default function SettingsPage() {
  return (
    <main className="container relative flex flex-col pt-8">
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <div>
          <h1 className="text-4xl">Settings</h1>
          <p className="text-muted-foreground">Configure your personal data</p>
        </div>
      </div>
      <section className="p-4">
        <SettingsForm />
      </section>
    </main>
  );
}
