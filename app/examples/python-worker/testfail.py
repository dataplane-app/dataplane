import numpy as np
import pandas as pd
import sys

s = pd.Series([1, 3, 5, np.nan, 6, 8])

print(s.info)

dates = pd.date_range("20130101", periods=6)

print(dates)

df = pd.DataFrame(np.random.randn(6, 4), index=dates, columns=list("ABCD"))

print(df)

sys.exit(2)

df = pd.DataFrame(np.random.randn(6, 4), index=dates, columns=list("ABCD"))

print(df)