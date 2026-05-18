import BinCard from './BinCard';

const Dashboard = ({ bins }) => {
  if (bins.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No bins found matching your criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bins.map((bin, index) => (
        <BinCard key={bin.id} bin={bin} index={index} />
      ))}
    </div>
  );
};

export default Dashboard;
