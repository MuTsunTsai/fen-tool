
type DialogAction<T> = (msg: string) => Promise<T>;

interface UseDialog<T> extends DialogAction<T> {
	setup: (d: DialogAction<T>) => void;
}

function useDialog<T>(): UseDialog<T> {
	let dialog: DialogAction<T>;
	const show = async function(msg) {
		await setupPromise;
		return dialog(msg);
	} as UseDialog<T>;
	const setupPromise = new Promise<void>(resolve => {
		show.setup = function(d) {
			dialog = d;
			resolve();
		};
	});
	return show;
}

export const alert = useDialog<void>();

export const confirm = useDialog<boolean>();
