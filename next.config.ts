import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	// Commented out, it caused issues
	// turbopack: {
	//   root: path.resolve(__dirname),
	// },
	// Allow serving uploaded files from /public/uploads
	async headers() {
		return [
			{
				source: "/uploads/:file*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=3600" },
				],
			},
		];
	},
};

export default nextConfig;
