# Dynamic CSV Dashboard

A dynamic, interactive React dashboard that automatically parses and visualizes any uploaded CSV file. Built with React, Vite, Tailwind CSS, and Recharts.

## Features

- **Upload Any CSV**: No hardcoded schemas. Upload your data and the dashboard adapts instantly.
- **Automatic Type Detection**: Automatically identifies numeric, date, and string columns to provide appropriate visualization options.
- **Dynamic Visualizations**: 
  - **Summary Metrics**: Instantly calculate totals, averages, and unique counts based on selected columns.
  - **Line Chart**: Visualize trends over time or sequential data.
  - **Bar Chart**: See the top categories for your selected metrics.
  - **Pie Chart**: Understand the distribution of your data.
- **Interactive Controls**: Dropdowns allow you to change the active metric (Y-axis), category (X-axis), and line chart axis on the fly.
- **Client-Side Processing**: Uses PapaParse for fast, secure, in-browser CSV parsing. No data is sent to a server.
- **Responsive Design**: Beautifully styled with Tailwind CSS to work on various screen sizes.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dynamic-csv-dashboard.git
   cd dynamic-csv-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

## Usage

1. Click the **Select CSV File** button on the welcome screen.
2. Choose a valid `.csv` file from your computer.
3. Once loaded, use the dropdown menus in the header to customize your view:
   - **Metric (Hash icon)**: Select a numeric column to sum/average, or choose "Row Count".
   - **Category (List icon)**: Select a string/categorical column to group your data by.
   - **Line Axis (Calendar icon)**: Select a date or sequential column for the line chart's X-axis.
4. Click **Upload New** to clear the current data and visualize a different file.

## License

MIT
