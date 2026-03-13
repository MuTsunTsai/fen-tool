declare module "*.scss" {
	const content: object;
	export default content;
}

declare module "*.css" {
	const content: object;
	export default content;
}

declare module "*.css?raw" {
	const content: string;
	export default content;
}
