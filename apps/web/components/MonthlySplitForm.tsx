"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AccountsApi from "../utils/apiClient/client/accountsApi";
import MonthlyIncomeSplitApi from "../utils/apiClient/client/monthlyIncomeSplitApi";
import ErrorMessage from "./ErrorMessage";

type Account = { id: number; name: string };

const MonthEnum = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const schema = z.object({
	fromAccountId: z.coerce.number().min(1, "Required"),
	toAccountId: z.coerce.number().min(1, "Required"),
	month: z.enum(MonthEnum).nonoptional("Required"),
	year: z.coerce.number().min(2000, "Year must be higher than 2000"),
	amount: z.coerce.number().positive("Must be positive"),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function MonthlySplitForm({ sheetId }) {
	const [accounts, setAccounts] = useState<Account[]>([]);

    const [error, setError] = useState<string|null>(null);
    const [creating, setCreating] = useState<boolean>(false);

	const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInput>({
		resolver: zodResolver(schema),
        defaultValues: {
            year: new Date().getFullYear(),
        },
	});

    useEffect(() => {
        const accountsApi = new AccountsApi(sheetId);

        async function loadData() {
            const accountsRaw: string[][] = await accountsApi.getAllObjects();
            const accountsFormatted = accountsRaw.map(row => ({
                id: parseInt(row["id"], 10),
                name: row["name"],
            }));

            setAccounts(accountsFormatted);
        }

        loadData();
    }, []);

	async function onSubmit(raw: FormInput) {
        setCreating(true);
        let data: FormData = schema.parse(raw);
        data["sheetId"] = sheetId;

        const splitApi = new MonthlyIncomeSplitApi(sheetId);

        try {
            const response = await splitApi.create(data);
            setError(null);
            alert("Successfully created");
        } catch(e) {
            console.log("An error occured adding the split: ", e);
            setError("An error occured adding the split");
        }
        setCreating(false);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div>
				<label>From Account</label>
				<select {...register("fromAccountId")}>
					<option value="">{accounts.length > 0 ? "Select..." : "Loading accounts..."}</option>
					{accounts.map(acc => (
						<option key={acc.id} value={acc.id}>{acc.name}</option>
					))}
				</select>
				{errors.fromAccountId && <ErrorMessage message={errors.fromAccountId.message}/>}
			</div>

			<div>
				<label>To Account</label>
				<select {...register("toAccountId")}>
					<option value="">{accounts.length > 0 ? "Select..." : "Loading accounts..."}</option>
					{accounts.map(acc => (
						<option key={acc.id} value={acc.id}>{acc.name}</option>
					))}
				</select>
				{errors.toAccountId && <ErrorMessage message={errors.toAccountId.message}/>}
			</div>

			<div>
                <span>
                    <label>Month</label>
                    <select {...register("month")}>
                        <option value="">Select...</option>
                        {MonthEnum.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    {errors.month && <ErrorMessage message={errors.month.message}/>}
                </span>
                <span>
                    <label>Year</label>
                    <input type="number" step="1" {...register("year")} />
                    {errors.year && <ErrorMessage message={errors.year.message}/>}
                </span>
			</div>

			<div>
				<label>Amount</label>
				<input type="number" step="0.01" {...register("amount")} />
				{errors.amount && <ErrorMessage message={errors.amount.message}/>}
			</div>
            
            <ErrorMessage message={error}/>

			<button type="submit" disabled={creating}>{creating ? "Loading..." : "Save"}</button>
		</form>
	);
}
