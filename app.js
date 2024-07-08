import { ChatGroq } from "@langchain/groq";
import 'dotenv/config'
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

var groq_api_key = process.env.GROQ_API_KEY; // Output: localhost
var sectors_api_key = process.env.SECTORS_API_KEY; // Output: root


const model = new ChatGroq({
  model: "llama3-70b-8192",
  temperature: 0
});

const get_daily_transaction_data = new DynamicStructuredTool({
    name: "get_daily_transaction_data",
    description: "Get daily transaction data for stock, such as close price, volume, and market cap on certain date",
    schema: z.object({
        stock: z.string().describe("A unique identifier or name of the company"),
        start_date: z.string().describe("A filter indicating the minimum date from which data is retrieved" ),
        end_date: z.string().describe("A filter indicating the maximum date up to which data is retrieved.")
      }),  
    func: async ({stock, start_date, end_date}) => { 
      // console.log("buzz")
      const url =  `https://api.sectors.app/v1/daily/${stock}/?start=${start_date}&end=${end_date}`
      
      // Menggunakan fetch untuk mengambil data
      try {
          const response = await fetch(url,{
              method: 'GET',
              headers: {
                  'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                  'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
              },
          
          } );
          const data = await response.json();
          // console.log(response.headers.Authorization)
          return data;
      } catch (error) {
          console.error('Error fetching data:', error);
          throw error;  // Re-throw the error after logging it
      }
    },
  })


const get_top_companies_based_on_transaction_volume = new DynamicStructuredTool({
      name: "get_top_companies_based_on_transaction_volume",
      description: "Get top companies based on transaction volume",
      schema: z.object({
        start_date: z.string().describe("A filter indicating the minimum date from which data is retrieved" ),
        end_date: z.string().describe("A filter indicating the maximum date up to which data is retrieved."),
        top_n : z.number().describe("The number of companies that have higher value")
        }),  
      func: async ({start_date, end_date, top_n}) => { 
        // console.log("buzz")
        const url =  `https://api.sectors.app/v1/most-traded/?start=${start_date}&end=${end_date}&n_stock=${top_n}`
        
        // Menggunakan fetch untuk mengambil data
        try {
            const response = await fetch(url,{
                method: 'GET',
                headers: {
                    'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                    'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
                },
            
            } );
            const data = await response.json();
            // console.log(response.headers.Authorization)
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;  // Re-throw the error after logging it
        }
      },
})

const get_company_info = new DynamicStructuredTool({
      name : "get_company_info",
      description : "Get company info, such as company name, listing board, industry, sub industry, sector, sub sector, market cap, market cap rank, address, employee num, listing date, website, phone, email, last close price, latest close date, daily close change",
      schema: z.object({
        stock: z.string().describe("A unique identifier or name of the company")
      }),  
      func: async ({stock}) => { 
        // console.log("buzz")
        const url =  `https://api.sectors.app/v1/company/report/${stock}/?sections=overview`
        
        // Menggunakan fetch untuk mengambil data
        try {
            const response = await fetch(url,{
                method: 'GET',
                headers: {
                    'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                    'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
                },
            
            } );
            const data = await response.json();
            // console.log(response.headers.Authorization)
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;  // Re-throw the error after logging it
        }
      },

})



const tools = [get_daily_transaction_data, get_top_companies_based_on_transaction_volume, get_company_info]


const llm_with_tools = await model.bindTools(tools);


const simple_query = "Give me the top 3 companies based on transaction volume on 2 April 2024"

const intermediate_query = "Based on the closing prices of BBRI from April 1 to April 28, is the trend positive or negative? Give me the detailed reason"

const complex_query = "What were the market cap of BBCA and BREN? Which one was higher For a stock with a higher market capitalization?, could you also provide me with the email, phone number, and website, as I am interested in investing there?"

const queries = [simple_query, intermediate_query, complex_query]

async function generate_output(query) {

    const startTime = Date.now(); 
  
    // const startTime = new Date().getTime();
    const messages = [
      new SystemMessage("You're a helpful assistant"),
      new HumanMessage(query),
    ];
    // console.log(message)
    // const chain = llm_with_tools.pipe(new Json);
    
    const ai_msg = await llm_with_tools.invoke(messages);
  // console.log("hai")
    ai_msg.tool_calls.forEach(tool_call => {

      // console.log(tool_call)
        const selected_tool = {
            "get_daily_transaction_data" : get_daily_transaction_data,
            "get_top_companies_based_on_transaction_volume" : get_top_companies_based_on_transaction_volume,
            "get_company_info" : get_company_info
        }[tool_call["name"].toLowerCase()]

        let tool_output =  selected_tool.invoke(tool_call["args"])
    
        tool_output.then((data) => {
          console.log(data);
          const endTime = Date.now(); 
          const timeTaken = endTime - startTime; 
  
          // console.log(`Result of addition = ${res}`); 
          console.log(`Time taken to perform addition = ${timeTaken} milliseconds`); 
          // console.log(`Waktu eksekusi: ${executionTime} milidetik`);
        }).catch((error) => {
          console.log("Promise rejected:", error);
        });
    });

}


generate_output(simple_query)


